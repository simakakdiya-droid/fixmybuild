import { NextResponse } from "next/server";
import { getFailedRuns, getRunLogs, createPullRequest } from "@/lib/github";
import { analyzeLogs } from "@/lib/groq";
import { supabase } from "@/lib/supabase";
import { pipelineFailureToRow } from "@/lib/pipeline-db";

const CONFIDENCE_THRESHOLD = 70;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  const isVercelCron = request.headers.get("x-vercel-cron") === "1";
  const host = request.headers.get("host") ?? "";
  const isLocalhost = host.startsWith("localhost") || host.startsWith("127.0.0.1");
  if (!isVercelCron && !isLocalhost && cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reposStr = process.env.GITHUB_REPOS ?? "";
  const repos = reposStr
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (repos.length === 0) {
    return NextResponse.json({ message: "No GITHUB_REPOS configured" });
  }

  for (const repoSpec of repos) {
    const parts = repoSpec.split("/").filter(Boolean);
    if (parts.length !== 2) continue;
    const [owner, repo] = parts;
    try {
      const runs = await getFailedRuns(owner, repo);
      for (const run of runs) {
        const id = `${owner}:${repo}:${run.runId}`;
        let errorLog = "No error lines extracted from logs.";
        let analysis: Awaited<ReturnType<typeof analyzeLogs>> = null;
        try {
          errorLog = await getRunLogs(owner, repo, run.runId);
          analysis = await analyzeLogs(errorLog);
        } catch (err) {
          console.error(`[cron] Run ${run.runId} (${owner}/${repo}):`, err);
          // store minimal failure
        }

        const failure = {
          id,
          pipelineName: run.workflowName,
          status: "failure",
          errorLog,
          failedStage: analysis?.failed_stage ?? null,
          errorSummary: analysis?.error_summary ?? null,
          rootCause: analysis?.root_cause ?? "Unknown",
          category: analysis?.category ?? null,
          fixSuggestion: analysis?.fix_suggestion ?? "",
          keyErrorLines: analysis?.key_error_lines ?? [],
          severity: analysis?.severity ?? null,
          confidence: analysis?.confidence ?? 0,
          explanation: analysis?.error_summary ?? "",
          command: "",
          createdAt: new Date().toISOString(),
          repoOwner: owner,
          repoName: repo,
          runId: run.runId,
          createdPullRequest: null as unknown,
        };

        const row = pipelineFailureToRow(failure) as Record<string, unknown>;
        const { error: upsertError } = await supabase.from("pipeline_failures").upsert(row, { onConflict: "id" });
        if (upsertError) console.error(`[cron] Supabase upsert failed for ${id}:`, upsertError);

        if (
          analysis &&
          analysis.confidence >= CONFIDENCE_THRESHOLD &&
          analysis.fix_suggestion
        ) {
          try {
            const branchName = `fixmybuild/fix-${run.runId}`;
            let fixContent = `# Fix suggestion\n\n${analysis.fix_suggestion}`;
            if (analysis.key_error_lines?.length) {
              fixContent +=
                "\n\n## Key error lines\n```\n" +
                analysis.key_error_lines.join("\n") +
                "\n```";
            }
            const pr = await createPullRequest(
              owner,
              repo,
              branchName,
              fixContent,
              `Fix: ${analysis.root_cause}`,
              `Fix: ${analysis.root_cause}`,
              `AI-suggested fix for pipeline failure (confidence: ${analysis.confidence}%).\n\n${analysis.error_summary}`
            );
            if (pr) {
              failure.createdPullRequest = pr as never;
              const updatedRow = pipelineFailureToRow(failure) as Record<string, unknown>;
              await supabase.from("pipeline_failures").upsert(updatedRow, { onConflict: "id" });
            }
          } catch {
            // keep failure without PR
          }
        }
      }
    } catch (err) {
      console.error(`Error processing ${owner}/${repo}:`, err);
    }
  }

  return NextResponse.json({ ok: true });
}
