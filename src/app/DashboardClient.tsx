"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import type { PipelineFailure } from "@/types/pipeline";

function SeverityBadge({ severity }: { severity?: string | null }) {
  const s = (severity ?? "").toLowerCase();
  const cls =
    s === "high" ? "badge severity-high" :
    s === "low"  ? "badge severity-low"  :
                   "badge severity-medium";
  const dot =
    s === "high" ? "🔴" :
    s === "low"  ? "🟢" : "🟡";
  return (
    <span className={cls}>
      {dot} {(severity ?? "—").toUpperCase()}
    </span>
  );
}

function StatCard({
  icon, label, value, color, iconBg,
}: {
  icon: string;
  label: string;
  value: string | number;
  color: string;
  iconBg: string;
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
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");

  const stats = useMemo(() => ({
    total:         list.length,
    critical:      list.filter((r) => r.severity?.toLowerCase() === "high").length,
    avgConfidence: list.length
      ? Math.round(list.reduce((a, r) => a + r.confidence, 0) / list.length)
      : 0,
    withPR: list.filter((r) => r.createdPullRequest).length,
  }), [list]);

  const filtered = useMemo(() => {
    return list.filter((row) => {
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
    });
  }, [list, search, severityFilter]);

  return (
    <>
      {/* Page header */}
      <div className="page-header">
        <h1 className="page-title">Pipeline Failures</h1>
        <p className="page-subtitle">Failed GitHub Actions runs with AI-powered root cause analysis</p>
      </div>

      {/* Stats */}
      <div className="stat-grid">
        <StatCard icon="📋" label="Total Failures"    value={stats.total}         color="#4f46e5" iconBg="#eef2ff" />
        <StatCard icon="🔴" label="High Severity"     value={stats.critical}      color="#dc2626" iconBg="#fef2f2" />
        <StatCard icon="🎯" label="Avg Confidence"    value={`${stats.avgConfidence}%`} color="#059669" iconBg="#ecfdf5" />
        <StatCard icon="🔀" label="PRs Created"       value={stats.withPR}        color="#d97706" iconBg="#fffbeb" />
      </div>

      {/* Filter bar */}
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
          onChange={(e) => setSeverityFilter(e.target.value)}
          aria-label="Filter by severity"
        >
          <option value="all">All Severities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <span className="filter-count">
          {filtered.length} of {list.length} results
        </span>
      </div>

      {/* Table */}
      {list.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <span className="empty-state-icon">🔍</span>
            <p className="empty-state-title">No pipeline failures yet</p>
            <p className="empty-state-body">
              Configure <code>GITHUB_REPOS</code> and wait for the cron job, or trigger
              analysis manually via the API.
            </p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
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
                  <td>
                    <p className="pipeline-name">{row.pipelineName}</p>
                    {row.repoOwner && row.repoName && (
                      <p className="pipeline-meta">{row.repoOwner}/{row.repoName}</p>
                    )}
                  </td>
                  <td>
                    <span className="badge badge-neutral">{row.failedStage ?? "—"}</span>
                  </td>
                  <td>
                    <span className={row.status === "failure" ? "badge badge-failure" : "badge badge-neutral"}>
                      {row.status}
                    </span>
                  </td>
                  <td>
                    <SeverityBadge severity={row.severity} />
                  </td>
                  <td>
                    <span className="root-cause-text" title={row.rootCause ?? undefined}>
                      {row.rootCause ?? "—"}
                    </span>
                  </td>
                  <td>
                    <div className="confidence-wrap">
                      <span className="confidence-label">{row.confidence}%</span>
                      <div className="confidence-bar-bg">
                        <div className="confidence-bar-fill" style={{ width: `${row.confidence}%` }} />
                      </div>
                    </div>
                  </td>
                  <td>
                    {row.createdPullRequest?.htmlUrl ? (
                      <a
                        href={row.createdPullRequest.htmlUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-ghost btn-sm"
                      >
                        View PR ↗
                      </a>
                    ) : (
                      <span style={{ color: "var(--text-faint)", fontSize: "0.875rem" }}>—</span>
                    )}
                  </td>
                  <td>
                    <Link
                      href={`/pipelines/${encodeURIComponent(row.id)}`}
                      className="btn btn-primary btn-sm"
                    >
                      View Fix →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
