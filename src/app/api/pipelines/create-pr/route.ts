import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { createPullRequest } from "@/lib/github";
import { rowToPipelineFailure } from "@/lib/pipeline-db";
import type { PipelineFailureRow } from "@/lib/pipeline-db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      pipelineFailureId,
      branchName: reqBranchName,
      repoOwner,
      repoName,
    } = body as {
      pipelineFailureId?: string;
      repoOwner?: string;
      repoName?: string;
      branchName?: string;
    };

    const { data: row, error: fetchError } = await supabase
      .from("pipeline_failures")
      .select("*")
      .eq("id", pipelineFailureId ?? "")
      .single();
    if (fetchError || !row) {
      return NextResponse.json(
        { error: "Pipeline failure not found or expired." },
        { status: 404 }
      );
    }

    const failure = rowToPipelineFailure(row as unknown as PipelineFailureRow);
    const owner = repoOwner ?? failure.repoOwner ?? "";
    const repo = repoName ?? failure.repoName ?? "";
    if (!owner || !repo) {
      return NextResponse.json(
        { error: "Repo owner and name are required." },
        { status: 400 }
      );
    }

    const branchName =
      reqBranchName ?? `fixmybuild/fix-${failure.runId ?? 0}`;
    let fixContent = `# Fix suggestion\n\n${failure.fixSuggestion}`;
    if (failure.keyErrorLines?.length) {
      fixContent +=
        "\n\n## Key error lines\n```\n" +
        failure.keyErrorLines.join("\n") +
        "\n```";
    }
    const commitMsg = `Fix: ${failure.rootCause}`;
    const prTitle = `Fix: ${failure.rootCause}`;
    const prBody = `AI-suggested fix for pipeline failure (confidence: ${failure.confidence}%).\n\n${failure.errorSummary ?? failure.explanation}`;

    const pr = await createPullRequest(
      owner,
      repo,
      branchName,
      fixContent,
      commitMsg,
      prTitle,
      prBody
    );
    if (!pr) {
      return NextResponse.json(
        { error: "Failed to create pull request." },
        { status: 500 }
      );
    }

    const { error: updateError } = await supabase
      .from("pipeline_failures")
      .update({
        created_pull_request: pr as unknown as Record<string, unknown>,
      })
      .eq("id", pipelineFailureId);
    if (updateError) throw updateError;

    return NextResponse.json(pr);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Create PR failed" },
      { status: 500 }
    );
  }
}
