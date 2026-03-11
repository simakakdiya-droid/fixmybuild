"use client";

import { useState } from "react";
import type { PipelineFailure, CreatedPullRequest } from "@/types/pipeline";

const DEFAULT_STAGES = [
  "Checkout",
  "Install Dependencies",
  "Build",
  "Test",
  "Deploy",
];

function isFailed(stage: string, failedStage: string): boolean {
  const failed = (failedStage || "").toLowerCase().trim();
  const s = stage.toLowerCase();
  if (!failed || failed === "unknown") return false;
  return s.includes(failed) || failed.includes(s);
}

function isBeforeFailed(
  stage: string,
  stages: string[],
  failedStage: string
): boolean {
  const idx = stages.indexOf(stage);
  const failedIdx = stages.findIndex((s) => isFailed(s, failedStage));
  if (failedIdx === -1) return false;
  return idx >= 0 && idx < failedIdx;
}

export function PipelineDetailsClient({
  failure: initialFailure,
}: {
  failure: PipelineFailure;
}) {
  const [failure, setFailure] = useState(initialFailure);
  const [creatingPr, setCreatingPr] = useState(false);
  const [toast, setToast] = useState<{ message: string; error?: boolean } | null>(null);
  const [expandedLog, setExpandedLog] = useState(false);
  const [expandedChanges, setExpandedChanges] = useState(false);

  const severityLevel =
    (failure.severity ?? "").toLowerCase() === "high"
      ? "high"
      : (failure.severity ?? "").toLowerCase() === "low"
        ? "low"
        : "medium";

  async function createPr() {
    if (!failure.id || !failure.repoOwner || !failure.repoName) return;
    setCreatingPr(true);
    try {
      const res = await fetch("/api/pipelines/create-pr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pipelineFailureId: failure.id,
          repoOwner: failure.repoOwner,
          repoName: failure.repoName,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setToast({
          message: data?.error ?? "Failed to create PR.",
          error: true,
        });
        return;
      }
      setToast({ message: "Pull request created." });
      const detailRes = await fetch(
        `/api/pipelines/${encodeURIComponent(failure.id)}`
      );
      if (detailRes.ok) {
        const updated = await detailRes.json();
        setFailure(updated);
      }
    } finally {
      setCreatingPr(false);
    }
  }

  return (
    <>
      {toast && (
        <div
          className={`toast ${toast.error ? "error" : ""}`}
          role="alert"
          onAnimationEnd={() => setToast(null)}
        >
          {toast.message}
        </div>
      )}

      <div className="card">
        <h2 className="section-label">Pipeline failure detected</h2>
        <p style={{ color: "#666", marginBottom: "1rem" }}>
          {failure.repoOwner}/{failure.repoName} · {failure.pipelineName}
        </p>

        <section style={{ marginTop: "1rem" }}>
          <h3 className="section-label">Failed stage</h3>
          <div className="stages">
            {DEFAULT_STAGES.map((stage) => (
              <div
                key={stage}
                className={`stage ${isFailed(stage, failure.failedStage ?? "") ? "failed" : ""}`}
                title={
                  isFailed(stage, failure.failedStage ?? "")
                    ? failure.rootCause
                    : undefined
                }
              >
                <span className="stage-icon">
                  {isFailed(stage, failure.failedStage ?? "")
                    ? "✕"
                    : isBeforeFailed(
                        stage,
                        DEFAULT_STAGES,
                        failure.failedStage ?? ""
                      )
                      ? "✓"
                      : "○"}
                </span>
                <span>{stage}</span>
              </div>
            ))}
          </div>
        </section>

        {failure.errorSummary && (
          <section style={{ marginTop: "1rem" }}>
            <h3 className="section-label">Error summary</h3>
            <p className="insight-text">{failure.errorSummary}</p>
          </section>
        )}

        <section style={{ marginTop: "1rem" }}>
          <h3 className="section-label">Root cause</h3>
          <p className="insight-text">{failure.rootCause}</p>
        </section>

        {failure.fixSuggestion && (
          <section style={{ marginTop: "1rem" }}>
            <h3 className="section-label">Suggested fix</h3>
            <p className="insight-text fix-suggestion">{failure.fixSuggestion}</p>
          </section>
        )}

        <section style={{ marginTop: "1rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <span
            className={`badge severity-${severityLevel}`}
          >
            Severity: {(failure.severity ?? "medium").toUpperCase()}
          </span>
          <span style={{ color: "#555" }}>Confidence: {failure.confidence}%</span>
        </section>
        <div
          style={{
            height: 8,
            marginTop: "0.25rem",
            borderRadius: 4,
            background: "#eee",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${failure.confidence}%`,
              height: "100%",
              background: "#1976d2",
            }}
          />
        </div>

        {failure.keyErrorLines && failure.keyErrorLines.length > 0 && (
          <section style={{ marginTop: "1.25rem" }}>
            <h3 className="section-label">Key error lines</h3>
            <pre className="key-error-block">
              {failure.keyErrorLines.join("\n")}
            </pre>
          </section>
        )}
      </div>

      <div className="expand-panel">
        <button
          type="button"
          className="expand-header"
          style={{ width: "100%", textAlign: "left" }}
          onClick={() => setExpandedLog(!expandedLog)}
        >
          {expandedLog ? "▼" : "▶"} Full error log
        </button>
        {expandedLog && (
          <div className="expand-body">
            <pre className="log-content">
              {failure.errorLog || "No log content."}
            </pre>
          </div>
        )}
      </div>

      {failure.createdPullRequest && (
        <div className="card">
          <h3 className="section-label">Pull Request Created</h3>
          <a
            href={(failure.createdPullRequest as CreatedPullRequest).htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
            style={{ marginRight: "0.5rem" }}
          >
            View PR #{(failure.createdPullRequest as CreatedPullRequest).prNumber}
          </a>
          <p style={{ margin: "1rem 0 0.5rem", color: "#666" }}>
            Branch: {(failure.createdPullRequest as CreatedPullRequest).branchName}
          </p>
          {(failure.createdPullRequest as CreatedPullRequest).changesSummary && (
            <>
              <button
                type="button"
                className="expand-header"
                style={{ width: "100%", textAlign: "left", marginTop: "0.5rem" }}
                onClick={() => setExpandedChanges(!expandedChanges)}
              >
                {expandedChanges ? "▼" : "▶"} Changes made
              </button>
              {expandedChanges && (
                <div className="expand-body">
                  <pre style={{ margin: 0, padding: "0.75rem", background: "#f5f5f5", borderRadius: 4, fontSize: 12, whiteSpace: "pre-wrap" }}>
                    {(failure.createdPullRequest as CreatedPullRequest).changesSummary}
                  </pre>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {!failure.createdPullRequest &&
        failure.repoOwner &&
        failure.repoName && (
          <div style={{ marginTop: "1rem" }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={createPr}
              disabled={creatingPr}
            >
              {creatingPr ? "Creating…" : "Generate Fix PR"}
            </button>
          </div>
        )}
    </>
  );
}
