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

function isBeforeFailed(stage: string, stages: string[], failedStage: string): boolean {
  const idx = stages.indexOf(stage);
  const failedIdx = stages.findIndex((s) => isFailed(s, failedStage));
  if (failedIdx === -1) return false;
  return idx >= 0 && idx < failedIdx;
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`expand-chevron${open ? " open" : ""}`}
      width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
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
    (failure.severity ?? "").toLowerCase() === "high" ? "high" :
    (failure.severity ?? "").toLowerCase() === "low"  ? "low"  : "medium";

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
        setToast({ message: data?.error ?? "Failed to create PR.", error: true });
        return;
      }
      setToast({ message: "✓ Pull request created successfully." });
      const detailRes = await fetch(`/api/pipelines/${encodeURIComponent(failure.id)}`);
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
          className={`toast${toast.error ? " error" : ""}`}
          role="alert"
          onAnimationEnd={() => setToast(null)}
        >
          {toast.message}
        </div>
      )}

      {/* ── Main failure card ── */}
      <div className="card">
        {/* Header row */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
          <div>
            <p className="section-label">Pipeline failure detected</p>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text)", letterSpacing: "-0.02em", marginBottom: "0.25rem" }}>
              {failure.pipelineName}
            </h2>
            {failure.repoOwner && failure.repoName && (
              <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
                {failure.repoOwner}/{failure.repoName}
              </p>
            )}
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <span className={`badge severity-${severityLevel}`}>
              {severityLevel === "high" ? "🔴" : severityLevel === "low" ? "🟢" : "🟡"}{" "}
              Severity: {(failure.severity ?? "MEDIUM").toUpperCase()}
            </span>
            <span className="badge badge-failure">{failure.status}</span>
          </div>
        </div>

        {/* Pipeline stage visualizer */}
        <section style={{ marginBottom: "1.5rem" }}>
          <p className="section-label">Pipeline stages</p>
          <div className="stages">
            {DEFAULT_STAGES.map((stage, idx) => {
              const failed  = isFailed(stage, failure.failedStage ?? "");
              const passed  = isBeforeFailed(stage, DEFAULT_STAGES, failure.failedStage ?? "");
              const stageClass = failed ? "failed" : passed ? "passed" : "pending";
              const icon = failed ? "✕" : passed ? "✓" : "○";
              return (
                <div key={stage} style={{ display: "flex", alignItems: "center" }}>
                  <div
                    className={`stage ${stageClass}`}
                    title={failed ? failure.rootCause ?? undefined : undefined}
                  >
                    <span className="stage-icon">{icon}</span>
                    <span>{stage}</span>
                  </div>
                  {idx < DEFAULT_STAGES.length - 1 && (
                    <div className="stage-connector" />
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <div className="detail-grid">
          {/* Left column */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {failure.errorSummary && (
              <section>
                <p className="section-label">Error summary</p>
                <p className="insight-text">{failure.errorSummary}</p>
              </section>
            )}

            <section>
              <p className="section-label">Root cause</p>
              <p className="insight-text">{failure.rootCause}</p>
            </section>

            {failure.fixSuggestion && (
              <section>
                <p className="section-label">Suggested fix</p>
                <p className="insight-text fix-suggestion">{failure.fixSuggestion}</p>
              </section>
            )}
          </div>

          {/* Right column — confidence */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <section>
              <p className="section-label">AI Confidence</p>
              <div className="confidence-detail-wrap">
                <div className="confidence-detail-header">
                  <span className="confidence-detail-label">Analysis certainty</span>
                  <span className="confidence-detail-value">{failure.confidence}%</span>
                </div>
                <div className="confidence-detail-bar-bg">
                  <div className="confidence-detail-bar-fill" style={{ width: `${failure.confidence}%` }} />
                </div>
              </div>
            </section>

            {failure.category && (
              <section>
                <p className="section-label">Category</p>
                <span className="badge badge-neutral" style={{ textTransform: "capitalize", fontSize: "0.8125rem" }}>
                  {failure.category}
                </span>
              </section>
            )}
          </div>
        </div>

        {/* Key error lines */}
        {failure.keyErrorLines && failure.keyErrorLines.length > 0 && (
          <section style={{ marginTop: "1.5rem" }}>
            <p className="section-label">Key error lines</p>
            <pre className="key-error-block">{failure.keyErrorLines.join("\n")}</pre>
          </section>
        )}
      </div>

      {/* ── Full error log ── */}
      <div className="expand-panel">
        <button
          type="button"
          className="expand-header"
          onClick={() => setExpandedLog(!expandedLog)}
          aria-expanded={expandedLog}
        >
          <span>Full error log</span>
          <ChevronIcon open={expandedLog} />
        </button>
        {expandedLog && (
          <div className="expand-body">
            <pre className="log-content">{failure.errorLog || "No log content."}</pre>
          </div>
        )}
      </div>

      {/* ── PR card ── */}
      {failure.createdPullRequest && (
        <div className="pr-card">
          <div className="pr-card-header">
            <p className="pr-card-title">✓ Pull Request Created</p>
            <a
              href={(failure.createdPullRequest as CreatedPullRequest).htmlUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-sm"
            >
              View PR #{(failure.createdPullRequest as CreatedPullRequest).prNumber} ↗
            </a>
          </div>
          <div className="pr-branch">
            🌿 {(failure.createdPullRequest as CreatedPullRequest).branchName}
          </div>

          {(failure.createdPullRequest as CreatedPullRequest).changesSummary && (
            <div className="expand-panel" style={{ marginTop: "0.875rem", marginBottom: 0 }}>
              <button
                type="button"
                className="expand-header"
                onClick={() => setExpandedChanges(!expandedChanges)}
                aria-expanded={expandedChanges}
              >
                <span>Changes made</span>
                <ChevronIcon open={expandedChanges} />
              </button>
              {expandedChanges && (
                <div className="expand-body">
                  <pre style={{ margin: 0, fontSize: 12, whiteSpace: "pre-wrap", color: "var(--text)" }}>
                    {(failure.createdPullRequest as CreatedPullRequest).changesSummary}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Generate PR button ── */}
      {!failure.createdPullRequest && failure.repoOwner && failure.repoName && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.5rem" }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={createPr}
            disabled={creatingPr}
          >
            {creatingPr ? (
              <>
                <span style={{ display: "inline-block", animation: "livePulse 0.8s infinite" }}>⏳</span>
                Creating PR…
              </>
            ) : (
              "🔀 Generate Fix PR"
            )}
          </button>
          {failure.confidence < 70 && (
            <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
              Low confidence ({failure.confidence}%) — review fix before merging
            </span>
          )}
        </div>
      )}
    </>
  );
}
