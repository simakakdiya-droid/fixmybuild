import type { PipelineFailure, CreatedPullRequest } from "@/types/pipeline";

export interface PipelineFailureRow {
  id: string;
  pipeline_name: string;
  status: string;
  error_log: string;
  failed_stage: string | null;
  error_summary: string | null;
  root_cause: string;
  category: string | null;
  fix_suggestion: string;
  key_error_lines: string[];
  severity: string | null;
  confidence: number;
  explanation: string;
  command: string;
  created_at: string;
  repo_owner: string | null;
  repo_name: string | null;
  run_id: number | null;
  created_pull_request: Record<string, unknown> | null;
}

export function rowToPipelineFailure(row: PipelineFailureRow): PipelineFailure {
  const pr = row.created_pull_request as CreatedPullRequest | null | undefined;
  return {
    id: row.id,
    pipelineName: row.pipeline_name,
    status: row.status,
    errorLog: row.error_log,
    failedStage: row.failed_stage,
    errorSummary: row.error_summary,
    rootCause: row.root_cause,
    category: row.category,
    fixSuggestion: row.fix_suggestion,
    keyErrorLines: Array.isArray(row.key_error_lines) ? row.key_error_lines : [],
    severity: row.severity,
    confidence: row.confidence,
    explanation: row.explanation,
    command: row.command,
    createdAt: row.created_at,
    repoOwner: row.repo_owner,
    repoName: row.repo_name,
    runId: row.run_id,
    createdPullRequest: pr && typeof pr.prNumber === "number" ? pr : null,
  };
}

export function pipelineFailureToRow(f: Partial<PipelineFailure>): Record<string, unknown> {
  return {
    id: f.id,
    pipeline_name: f.pipelineName ?? "",
    status: f.status ?? "failure",
    error_log: f.errorLog ?? "",
    failed_stage: f.failedStage ?? null,
    error_summary: f.errorSummary ?? null,
    root_cause: f.rootCause ?? "",
    category: f.category ?? null,
    fix_suggestion: f.fixSuggestion ?? "",
    key_error_lines: f.keyErrorLines ?? [],
    severity: f.severity ?? null,
    confidence: f.confidence ?? 0,
    explanation: f.explanation ?? "",
    command: f.command ?? "",
    created_at: f.createdAt ?? new Date().toISOString(),
    repo_owner: f.repoOwner ?? null,
    repo_name: f.repoName ?? null,
    run_id: f.runId ?? null,
    created_pull_request: f.createdPullRequest ? (f.createdPullRequest as unknown as Record<string, unknown>) : null,
  };
}
