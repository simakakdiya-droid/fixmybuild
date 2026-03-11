export interface CreatedPullRequest {
  prNumber: number;
  htmlUrl: string;
  branchName: string;
  title: string;
  body: string;
  changesSummary: string;
}

export interface PipelineFailure {
  id: string;
  pipelineName: string;
  status: string;
  errorLog: string;
  failedStage?: string | null;
  errorSummary?: string | null;
  rootCause: string;
  category?: string | null;
  fixSuggestion: string;
  keyErrorLines: string[];
  severity?: string | null;
  confidence: number;
  explanation: string;
  command: string;
  createdAt: string;
  repoOwner?: string | null;
  repoName?: string | null;
  runId?: number | null;
  createdPullRequest?: CreatedPullRequest | null;
}

export interface AIAnalysis {
  failed_stage: string;
  error_summary: string;
  root_cause: string;
  category: string;
  fix_suggestion: string;
  key_error_lines: string[];
  severity: string;
  confidence: number;
}

export interface AnalyzeRequest {
  owner: string;
  repo: string;
  runId: number;
}

export interface CreatePrRequest {
  pipelineFailureId: string;
  branchName?: string;
  repoOwner: string;
  repoName: string;
}
