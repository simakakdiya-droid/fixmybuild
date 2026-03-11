import { extractTextFromZipBuffer, extractErrorLines } from "./zip";
import type { CreatedPullRequest } from "@/types/pipeline";

const GITHUB_API = "https://api.github.com";
const token = process.env.GITHUB_TOKEN ?? "";

function getHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "FixMyBuild-AI",
  };
}

interface WorkflowRun {
  id: number;
  name: string | null;
  path: string | null;
  status: string | null;
  conclusion: string | null;
  created_at: string;
}

interface RunsResponse {
  workflow_runs: WorkflowRun[];
}

export interface PipelineRun {
  runId: number;
  repository: string;
  workflowName: string;
  status: string;
  conclusion: string | null;
  createdAt: string;
}

export async function getFailedRuns(
  owner: string,
  repo: string
): Promise<PipelineRun[]> {
  const url = `${GITHUB_API}/repos/${owner}/${repo}/actions/runs?per_page=30`;
  const res = await fetch(url, { headers: getHeaders() });
  if (!res.ok) throw new Error(`GitHub API: ${res.status} ${res.statusText}`);
  const data = (await res.json()) as RunsResponse;
  const runs = data.workflow_runs ?? [];
  return runs
    .filter((r) => String(r.conclusion).toLowerCase() === "failure")
    .map((r) => ({
      runId: r.id,
      repository: `${owner}/${repo}`,
      workflowName: r.name ?? r.path ?? "Unknown",
      status: r.status ?? "completed",
      conclusion: r.conclusion,
      createdAt: r.created_at,
    }));
}

export async function getRunLogs(
  owner: string,
  repo: string,
  runId: number
): Promise<string> {
  const logsUrl = `${GITHUB_API}/repos/${owner}/${repo}/actions/runs/${runId}/logs`;
  const res = await fetch(logsUrl, {
    headers: getHeaders(),
    redirect: "manual",
  });
  const isRedirect = res.status === 301 || res.status === 302 || res.status === 307 || res.status === 308;
  if (!res.ok && !isRedirect) throw new Error(`GitHub logs: ${res.status}`);

  let buffer: ArrayBuffer;
  const location = res.headers.get("location");
  if (location) {
    const redirectRes = await fetch(location, {
      headers: { ...getHeaders(), Authorization: `Bearer ${token}` },
    });
    if (!redirectRes.ok) throw new Error(`GitHub logs redirect: ${redirectRes.status}`);
    buffer = await redirectRes.arrayBuffer();
  } else {
    buffer = await res.arrayBuffer();
  }

  const text = extractTextFromZipBuffer(Buffer.from(buffer));
  const errorLines = extractErrorLines(text);
  if (errorLines.trim()) return errorLines;
  // If no lines matched "error|exception|failed", send last 12k chars of full log so AI has context
  const truncated = text.length > 12000 ? text.slice(-12000) : text;
  return truncated.trim() || "No error lines extracted from logs.";
}

interface RepoResponse {
  default_branch: string;
}

interface RefResponse {
  object: { sha: string };
}

interface ContentResponse {
  sha: string;
}

interface PRResponse {
  number: number;
  html_url: string;
}

export async function createPullRequest(
  owner: string,
  repo: string,
  branchName: string,
  fixContent: string,
  commitMessage: string,
  prTitle: string,
  prBody: string
): Promise<CreatedPullRequest | null> {
  const basePath = `${GITHUB_API}/repos/${owner}/${repo}`;
  const headers = getHeaders();

  const repoRes = await fetch(basePath, { headers });
  if (!repoRes.ok) return null;
  const repoData = (await repoRes.json()) as RepoResponse;
  const defaultBranch = repoData.default_branch ?? "main";

  const refRes = await fetch(`${basePath}/git/ref/heads/${defaultBranch}`, { headers });
  if (!refRes.ok) return null;
  const refData = (await refRes.json()) as RefResponse;
  const latestSha = refData?.object?.sha;
  if (!latestSha) return null;

  const createRefRes = await fetch(`${basePath}/git/refs`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha: latestSha }),
  });
  if (!createRefRes.ok && createRefRes.status !== 422) return null;

  const fixFileName = "FIX_SUGGESTION.md";
  const contentBase64 = Buffer.from(fixContent, "utf8").toString("base64");
  let createFileRes = await fetch(`${basePath}/contents/${fixFileName}`, {
    method: "PUT",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({
      message: commitMessage,
      content: contentBase64,
      branch: branchName,
    }),
  });

  if (createFileRes.status === 422) {
    const getContentRes = await fetch(
      `${basePath}/contents/${fixFileName}?ref=${encodeURIComponent(branchName)}`,
      { headers }
    );
    if (getContentRes.ok) {
      const contentData = (await getContentRes.json()) as ContentResponse;
      createFileRes = await fetch(`${basePath}/contents/${fixFileName}`, {
        method: "PUT",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          message: commitMessage,
          content: contentBase64,
          branch: branchName,
          sha: contentData.sha,
        }),
      });
    }
  }
  if (!createFileRes.ok) return null;

  const prRes = await fetch(`${basePath}/pulls`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({
      title: prTitle,
      body: prBody,
      head: branchName,
      base: defaultBranch,
    }),
  });

  if (prRes.ok) {
    const prData = (await prRes.json()) as PRResponse;
    return {
      prNumber: prData.number,
      htmlUrl: prData.html_url ?? "",
      branchName,
      title: prTitle,
      body: prBody,
      changesSummary: `Added/updated ${fixFileName} with recommended fix.`,
    };
  }
  if (prRes.status === 422) {
    const pullsRes = await fetch(
      `${basePath}/pulls?head=${owner}:${branchName}&state=open`,
      { headers }
    );
    if (!pullsRes.ok) return null;
    const pulls = (await pullsRes.json()) as PRResponse[];
    const existing = pulls?.[0];
    if (existing)
      return {
        prNumber: existing.number,
        htmlUrl: existing.html_url ?? "",
        branchName,
        title: prTitle,
        body: prBody,
        changesSummary: `Updated ${fixFileName}; existing PR #${existing.number}.`,
      };
  }
  return null;
}
