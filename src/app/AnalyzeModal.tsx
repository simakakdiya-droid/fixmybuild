"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AnalyzeModal({ onClose }: { onClose: () => void }) {
  const [owner, setOwner]   = useState("");
  const [repo,  setRepo]    = useState("");
  const [runId, setRunId]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!owner.trim() || !repo.trim() || !runId.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/pipelines/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner: owner.trim(), repo: repo.trim(), runId: parseInt(runId) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Analysis failed. Check owner, repo, and run ID.");
        return;
      }
      setSuccess(true);
      router.refresh();
      setTimeout(() => onClose(), 1800);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Analyze Repository">
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="modal-header">
          <div>
            <p className="modal-eyebrow">AI Analysis</p>
            <h2 className="modal-title">Analyze a Repository</h2>
            <p className="modal-desc">Provide a failed GitHub Actions run and FixMyBuild AI will fetch the logs, find the root cause, and suggest a fix.</p>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Success state */}
        {success ? (
          <div className="modal-success">
            <div className="modal-success-icon">✓</div>
            <p className="modal-success-title">Analysis complete!</p>
            <p className="modal-success-body">Dashboard is refreshing with the new results…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div className="modal-fields">
              <div className="modal-field-row">
                <div className="modal-field">
                  <label className="modal-label" htmlFor="m-owner">GitHub Owner</label>
                  <input
                    id="m-owner"
                    type="text"
                    className="modal-input"
                    placeholder="e.g. facebook"
                    value={owner}
                    onChange={(e) => setOwner(e.target.value)}
                    required
                    autoFocus
                    autoComplete="off"
                  />
                </div>
                <div className="modal-field">
                  <label className="modal-label" htmlFor="m-repo">Repository Name</label>
                  <input
                    id="m-repo"
                    type="text"
                    className="modal-input"
                    placeholder="e.g. react"
                    value={repo}
                    onChange={(e) => setRepo(e.target.value)}
                    required
                    autoComplete="off"
                  />
                </div>
              </div>
              <div className="modal-field">
                <label className="modal-label" htmlFor="m-runid">
                  GitHub Actions Run ID
                  <a
                    href="https://docs.github.com/en/actions/monitoring-and-troubleshooting-workflows/viewing-workflow-run-history"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="modal-label-link"
                  >
                    Where do I find this? ↗
                  </a>
                </label>
                <input
                  id="m-runid"
                  type="number"
                  className="modal-input"
                  placeholder="e.g. 12345678901"
                  value={runId}
                  onChange={(e) => setRunId(e.target.value)}
                  required
                  min="1"
                />
                <p className="modal-hint">Found in the GitHub Actions URL: /actions/runs/<strong>RUN_ID</strong></p>
              </div>
            </div>

            {error && (
              <div className="modal-error" role="alert">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            {/* Flow hint */}
            <div className="modal-flow">
              {["Fetch Logs", "Extract Errors", "AI Analysis", "Save + PR"].map((step, i, arr) => (
                <div key={step} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span className="modal-flow-step">{step}</span>
                  {i < arr.length - 1 && <span style={{ color: "var(--text-faint)", fontSize: 12 }}>→</span>}
                </div>
              ))}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>Cancel</button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || !owner || !repo || !runId}
              >
                {loading ? (
                  <><span className="spinner" />Analyzing…</>
                ) : (
                  "🤖 Run AI Analysis"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
