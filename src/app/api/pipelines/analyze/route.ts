import { NextResponse } from "next/server";
import { getFailedRuns, getRunLogs } from "@/lib/github";
import { analyzeLogs } from "@/lib/groq";
import { supabase } from "@/lib/supabase";
import { pipelineFailureToRow } from "@/lib/pipeline-db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { owner, repo, runId } = body as { owner?: string; repo?: string; runId?: number };
    if (!owner?.trim() || !repo?.trim()) {
      return NextResponse.json(
        { error: "Owner and Repo are required." },
        { status: 400 }
      );
    }
    const runs = await getFailedRuns(owner, repo);
    const run = runs.find((r) => r.runId === runId);
    const workflowName = run?.workflowName ?? `Run ${runId ?? ""}`;
    const id = `${owner}:${repo}:${runId ?? 0}`;

    let errorLog = "No error lines extracted from logs.";
    let analysis: Awaited<ReturnType<typeof analyzeLogs>> = null;
    try {
      errorLog = await getRunLogs(owner, repo, runId ?? 0);
      analysis = await analyzeLogs(errorLog);
    } catch {
      // keep defaults
    }

    const failure = {
      id,
      pipelineName: workflowName,
      status: "failure",
      errorLog,
      failedStage: analysis?.failed_stage ?? null,
      errorSummary: analysis?.error_summary ?? null,
      rootCause: analysis?.root_cause ?? "Analysis unavailable",
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
      runId: runId ?? null,
      createdPullRequest: null,
    };

    const row = pipelineFailureToRow(failure) as Record<string, unknown>;
    const { error } = await supabase.from("pipeline_failures").upsert(row, {
      onConflict: "id",
    });
    if (error) throw error;

    return NextResponse.json(failure);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Analysis failed" },
      { status: 500 }
    );
  }
}
