import { rowToPipelineFailure, pipelineFailureToRow } from "@/lib/pipeline-db";
import type { PipelineFailureRow } from "@/lib/pipeline-db";

const sampleRow: PipelineFailureRow = {
  id: "org:repo:12345",
  pipeline_name: "CI / build",
  status: "failure",
  error_log: "npm ERR! code ENOENT",
  failed_stage: "Build",
  error_summary: "Build failed due to missing package",
  root_cause: "Missing node_modules — lockfile out of sync",
  category: "dependency",
  fix_suggestion: "Run npm ci to restore node_modules",
  key_error_lines: ["npm ERR! code ENOENT", "npm ERR! syscall open"],
  severity: "high",
  confidence: 88,
  explanation: "The lockfile diverged from package.json",
  command: "npm run build",
  created_at: "2026-03-13T10:00:00Z",
  repo_owner: "org",
  repo_name: "repo",
  run_id: 12345,
  created_pull_request: null,
};

describe("rowToPipelineFailure", () => {
  it("maps snake_case row fields to camelCase domain object", () => {
    const failure = rowToPipelineFailure(sampleRow);
    expect(failure.id).toBe("org:repo:12345");
    expect(failure.pipelineName).toBe("CI / build");
    expect(failure.failedStage).toBe("Build");
    expect(failure.rootCause).toBe("Missing node_modules — lockfile out of sync");
    expect(failure.severity).toBe("high");
    expect(failure.confidence).toBe(88);
    expect(failure.repoOwner).toBe("org");
    expect(failure.repoName).toBe("repo");
    expect(failure.runId).toBe(12345);
  });

  it("returns empty array for key_error_lines when null", () => {
    const row = { ...sampleRow, key_error_lines: null as unknown as string[] };
    const failure = rowToPipelineFailure(row);
    expect(failure.keyErrorLines).toEqual([]);
  });

  it("maps created_pull_request to null when not a valid PR object", () => {
    const failure = rowToPipelineFailure(sampleRow);
    expect(failure.createdPullRequest).toBeNull();
  });

  it("maps a valid created_pull_request", () => {
    const row = {
      ...sampleRow,
      created_pull_request: {
        prNumber: 42,
        htmlUrl: "https://github.com/org/repo/pull/42",
        branchName: "fixmybuild/fix-12345",
        changesSummary: "Updated package-lock.json",
      },
    };
    const failure = rowToPipelineFailure(row);
    expect(failure.createdPullRequest).not.toBeNull();
  });
});

describe("pipelineFailureToRow (round-trip smoke test)", () => {
  it("converts a partial failure back to a row without throwing", () => {
    const failure = rowToPipelineFailure(sampleRow);
    const row = pipelineFailureToRow(failure);
    expect(row.id).toBe(failure.id);
    expect(row.pipeline_name).toBe(failure.pipelineName);
    expect(row.severity).toBe(failure.severity);
    expect(row.confidence).toBe(failure.confidence);
  });
});
