"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { PipelineFailure } from "@/types/pipeline";
import { AnalyzeModal } from "./AnalyzeModal";
import { CategoryChart } from "./CategoryChart";
import { ImpactMetrics } from "./ImpactMetrics";
import { TrendCharts } from "./TrendCharts";

function SeverityBadge({ severity }: { severity?: string | null }) {
  const s = (severity ?? "").toLowerCase();
  const cls =
    s === "high" ? "badge severity-high" :
    s === "low"  ? "badge severity-low"  :
                   "badge severity-medium";
  const dot = s === "high" ? "🔴" : s === "low" ? "🟢" : "🟡";
  return <span className={cls}>{dot} {(severity ?? "—").toUpperCase()}</span>;
}

function StatCard({ icon, label, value, color, iconBg }: {
  icon: string; label: string; value: string | number; color: string; iconBg: string;
}) {
  return (
    <div className="stat-card" style={{ "--stat-color": color, "--stat-icon-bg": iconBg } as React.CSSProperties}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

export function DashboardClient({ list }: { list: PipelineFailure[] }) {
  const [search, setSearch]           = useState("");
  const [severityFilter, setSeverity] = useState("all");
  const [showModal, setShowModal]     = useState(false);
  const [seeding, setSeeding]         = useState(false);
  const [seedMsg, setSeedMsg]         = useState<string | null>(null);
  const router = useRouter();

  const stats = useMemo(() => ({
    total:         list.length,
    critical:      list.filter((r) => r.severity?.toLowerCase() === "high").length,
    avgConfidence: list.length ? Math.round(list.reduce((a, r) => a + r.confidence, 0) / list.length) : 0,
    withPR:        list.filter((r) => r.createdPullRequest).length,
  }), [list]);

  const filtered = useMemo(() => list.filter((row) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      row.pipelineName.toLowerCase().includes(q) ||
      (row.rootCause ?? "").toLowerCase().includes(q) ||
      (row.failedStage ?? "").toLowerCase().includes(q) ||
      (row.repoName ?? "").toLowerCase().includes(q);
    const matchSeverity =
      severityFilter === "all" ||
      (row.severity ?? "medium").toLowerCase() === severityFilter;
    return matchSearch && matchSeverity;
  }), [list, search, severityFilter]);

  async function handleSeedDemo() {
    setSeeding(true);
    setSeedMsg(null);
    try {
      const res = await fetch("/api/demo/seed", { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setSeedMsg(`Error: ${data.error}`); return; }
      setSeedMsg(`✓ ${data.seeded} demo failures loaded!`);
      router.refresh();
    } catch {
      setSeedMsg("Network error. Please try again.");
    } finally {
      setSeeding(false);
    }
  }

  return (
    <>
      {showModal && <AnalyzeModal onClose={() => setShowModal(false)} />}

      {/* ── Page header ── */}
      <div className="page-header page-header-inner" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 className="page-title">Pipeline Failures</h1>
          <p className="page-subtitle">Failed GitHub Actions runs with AI-powered root cause analysis</p>
        </div>
        <div style={{ display: "flex", gap: "0.625rem", alignItems: "center", flexWrap: "wrap" }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={handleSeedDemo}
            disabled={seeding}
            title="Load realistic demo data to explore the dashboard"
          >
            {seeding ? <><span className="spinner" />Loading…</> : "🎬 Try Demo"}
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
            + Analyze Repo
          </button>
        </div>
      </div>

      {seedMsg && (
        <div className={`seed-toast ${seedMsg.startsWith("Error") ? "seed-toast-error" : ""}`} role="status">
          {seedMsg}
        </div>
      )}

      {/* ── Stats ── */}
      <div className="stat-grid">
        <StatCard icon="📋" label="Total Failures"  value={stats.total}                  color="#4f46e5" iconBg="#eef2ff" />
        <StatCard icon="🔴" label="High Severity"   value={stats.critical}               color="#dc2626" iconBg="#fef2f2" />
        <StatCard icon="🎯" label="Avg Confidence"  value={`${stats.avgConfidence}%`}    color="#059669" iconBg="#ecfdf5" />
        <StatCard icon="🔀" label="PRs Created"     value={stats.withPR}                 color="#d97706" iconBg="#fffbeb" />
      </div>

      {/* ── Impact metrics (before/after) ── */}
      <ImpactMetrics list={list} />

      {/* ── Category chart + empty CTA ── */}
      {list.length > 0 ? (
        <CategoryChart list={list} />
      ) : (
        <div className="card">
          <div className="empty-state">
            <span className="empty-state-icon">🔍</span>
            <p className="empty-state-title">No pipeline failures yet</p>
            <p className="empty-state-body" style={{ marginBottom: "1.5rem" }}>
              Load demo data to explore the dashboard, or analyze a real GitHub Actions run.
            </p>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
              <button className="btn btn-primary" onClick={handleSeedDemo} disabled={seeding}>
                {seeding ? <><span className="spinner" />Loading…</> : "🎬 Load Demo Data"}
              </button>
              <button className="btn btn-ghost" onClick={() => setShowModal(true)}>
                + Analyze Real Repo
              </button>
            </div>
            {seedMsg && (
              <p style={{ marginTop: "1rem", fontSize: "0.875rem", color: seedMsg.startsWith("Error") ? "var(--danger)" : "var(--success)" }}>
                {seedMsg}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Trend charts ── */}
      <TrendCharts list={list} />

      {/* ── Filter bar (only shown when data exists) ── */}
      {list.length > 0 && (
        <div className="filter-bar">
          <div className="search-wrap">
            <span className="search-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
            </span>
            <input
              type="search"
              className="search-input"
              placeholder="Search pipelines, stages, root causes…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="filter-select"
            value={severityFilter}
            onChange={(e) => setSeverity(e.target.value)}
            aria-label="Filter by severity"
          >
            <option value="all">All Severities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <span className="filter-count">{filtered.length} of {list.length} results</span>
        </div>
      )}

      {/* ── Table ── */}
      {list.length > 0 && (
        filtered.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <span className="empty-state-icon">🔎</span>
              <p className="empty-state-title">No results match your filters</p>
              <p className="empty-state-body">Try adjusting your search or severity filter.</p>
            </div>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Pipeline</th>
                  <th>Stage</th>
                  <th>Status</th>
                  <th>Severity</th>
                  <th>Root Cause</th>
                  <th>Confidence</th>
                  <th>PR</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id}>
                    <td data-label="Pipeline">
                      <p className="pipeline-name">{row.pipelineName}</p>
                      {row.repoOwner && row.repoName && (
                        <p className="pipeline-meta">{row.repoOwner}/{row.repoName}</p>
                      )}
                    </td>
                    <td data-label="Stage">
                      <span className="badge badge-neutral">{row.failedStage ?? "—"}</span>
                    </td>
                    <td data-label="Status">
                      <span className={row.status === "failure" ? "badge badge-failure" : "badge badge-neutral"}>
                        {row.status}
                      </span>
                    </td>
                    <td data-label="Severity"><SeverityBadge severity={row.severity} /></td>
                    <td data-label="Root Cause">
                      <span className="root-cause-text" title={row.rootCause ?? undefined}>
                        {row.rootCause ?? "—"}
                      </span>
                    </td>
                    <td data-label="Confidence">
                      <div className="confidence-wrap">
                        <span className="confidence-label">{row.confidence}%</span>
                        <div className="confidence-bar-bg">
                          <div className="confidence-bar-fill" style={{ width: `${row.confidence}%` }} />
                        </div>
                      </div>
                    </td>
                    <td data-label="PR">
                      {row.createdPullRequest?.htmlUrl ? (
                        <a href={row.createdPullRequest.htmlUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
                          View PR ↗
                        </a>
                      ) : (
                        <span style={{ color: "var(--text-faint)", fontSize: "0.875rem" }}>—</span>
                      )}
                    </td>
                    <td data-label="Action">
                      <Link href={`/pipelines/${encodeURIComponent(row.id)}`} className="btn btn-primary btn-sm">
                        View Fix →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </>
  );
}
