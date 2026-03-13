"use client";

import { useState, useMemo } from "react";
import type { PipelineFailure } from "@/types/pipeline";

// ─── helpers ─────────────────────────────────────────────────────────────────

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}

function buildDailyBuckets(list: PipelineFailure[], days: number) {
  const now = new Date();
  const buckets: { date: string; label: string; count: number }[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const date = toDateStr(d);
    const label =
      days <= 7
        ? d.toLocaleDateString("en-US", { weekday: "short" })        // Mon
        : i % 5 === 0
        ? d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) // Mar 8
        : "";
    buckets.push({ date, label, count: 0 });
  }

  for (const item of list) {
    const date = item.createdAt?.slice(0, 10);
    const b = buckets.find((x) => x.date === date);
    if (b) b.count++;
  }
  return buckets;
}

const CONF_BUCKETS = [
  { min: 0,  max: 20,  label: "0–19%",   color: "#dc2626" },
  { min: 20, max: 40,  label: "20–39%",  color: "#f97316" },
  { min: 40, max: 60,  label: "40–59%",  color: "#d97706" },
  { min: 60, max: 80,  label: "60–79%",  color: "#16a34a" },
  { min: 80, max: 101, label: "80–100%", color: "#059669" },
];

const CATEGORIES = [
  { key: "dependency",     label: "Dependency",    color: "#d97706" },
  { key: "code",           label: "Code",          color: "#4f46e5" },
  { key: "configuration",  label: "Config",        color: "#059669" },
  { key: "test",           label: "Test",          color: "#7c3aed" },
  { key: "infrastructure", label: "Infra",         color: "#dc2626" },
];

// ─── sub-components ───────────────────────────────────────────────────────────

/** Simple CSS bar chart (vertical) */
function DailyBarsChart({ data }: { data: { label: string; count: number }[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="daily-bars">
      {data.map((d, i) => (
        <div key={i} className="daily-bar-col" title={`${d.label || d.count}: ${d.count} failure${d.count !== 1 ? "s" : ""}`}>
          <div
            className="daily-bar-fill"
            style={{
              height: `${Math.max((d.count / max) * 56, d.count > 0 ? 4 : 0)}px`,
              opacity: d.count === 0 ? 0.18 : 1,
            }}
          />
          {d.label && <span className="daily-bar-label">{d.label}</span>}
        </div>
      ))}
    </div>
  );
}

/** Horizontal percentage bar row */
function HBar({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total ? Math.round((count / total) * 100) : 0;
  const width = total ? Math.round((count / total) * 100) : 0;
  return (
    <div className="hbar-row">
      <span className="hbar-label">{label}</span>
      <div className="hbar-track">
        <div
          className="hbar-fill"
          style={{ width: `${width}%`, background: color }}
          role="progressbar"
          aria-valuenow={count}
          aria-valuemax={total}
        />
      </div>
      <span className="hbar-count">{count}</span>
      <span className="hbar-pct">{pct}%</span>
    </div>
  );
}

/** Chart panel wrapper */
function ChartPanel({
  title,
  eyebrow,
  badge,
  children,
}: {
  title: string;
  eyebrow: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="trend-panel">
      <div className="trend-panel-header">
        <div>
          <p className="chart-eyebrow">{eyebrow}</p>
          <h3 className="chart-title">{title}</h3>
        </div>
        {badge && <span className="trend-badge">{badge}</span>}
      </div>
      {children}
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

type Range = "7d" | "30d";

export function TrendCharts({ list }: { list: PipelineFailure[] }) {
  const [range, setRange] = useState<Range>("7d");

  const days = range === "7d" ? 7 : 30;

  const cutoff = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().slice(0, 10);
  }, [days]);

  const windowList = useMemo(
    () => list.filter((r) => (r.createdAt?.slice(0, 10) ?? "") >= cutoff),
    [list, cutoff]
  );

  const daily = useMemo(() => buildDailyBuckets(windowList, days), [windowList, days]);

  const confData = useMemo(
    () =>
      CONF_BUCKETS.map((b) => ({
        ...b,
        count: windowList.filter((r) => r.confidence >= b.min && r.confidence < b.max).length,
      })),
    [windowList]
  );

  const catData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of windowList) {
      const k = (item.category ?? "code").toLowerCase();
      counts[k] = (counts[k] ?? 0) + 1;
    }
    return CATEGORIES.map((c) => ({ ...c, count: counts[c.key] ?? 0 }));
  }, [windowList]);

  const repoData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of windowList) {
      const k =
        item.repoOwner && item.repoName
          ? `${item.repoOwner}/${item.repoName}`
          : "unknown";
      counts[k] = (counts[k] ?? 0) + 1;
    }
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([repo, count]) => ({ repo, count }));
  }, [windowList]);

  const repoMax = repoData[0]?.count ?? 1;
  const confTotal = windowList.length || 1;

  if (list.length === 0) return null;

  return (
    <div className="trend-section">
      {/* Header + range toggle */}
      <div className="trend-section-header">
        <div>
          <p className="chart-eyebrow">Analytics</p>
          <h2 className="trend-section-title">Trend Charts</h2>
        </div>
        <div className="trend-toggle" role="group" aria-label="Time range">
          {(["7d", "30d"] as Range[]).map((r) => (
            <button
              key={r}
              className={`trend-toggle-btn${range === r ? " active" : ""}`}
              onClick={() => setRange(r)}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="trend-grid">

        {/* 1. Daily failures */}
        <ChartPanel
          eyebrow="Over time"
          title="Daily Failures"
          badge={`${windowList.length} total`}
        >
          <DailyBarsChart data={daily} />
          {windowList.length === 0 && (
            <p className="trend-empty">No failures in this window</p>
          )}
        </ChartPanel>

        {/* 2. Category distribution */}
        <ChartPanel
          eyebrow="Pattern"
          title="Category Breakdown"
          badge={`${range}`}
        >
          <div className="hbar-list">
            {catData.map((c) => (
              <HBar
                key={c.key}
                label={c.label}
                count={c.count}
                total={windowList.length || 1}
                color={c.color}
              />
            ))}
          </div>
          {windowList.length === 0 && (
            <p className="trend-empty">No data in this window</p>
          )}
        </ChartPanel>

        {/* 3. Confidence distribution */}
        <ChartPanel
          eyebrow="AI Quality"
          title="Confidence Distribution"
          badge={`${range}`}
        >
          <div className="hbar-list">
            {confData.map((b) => (
              <HBar
                key={b.label}
                label={b.label}
                count={b.count}
                total={confTotal}
                color={b.color}
              />
            ))}
          </div>
          <div className="conf-legend">
            <span style={{ color: "#059669" }}>■</span> ≥60% = PR-ready
            <span style={{ color: "#dc2626", marginLeft: "0.75rem" }}>■</span> &lt;40% = review needed
          </div>
        </ChartPanel>

        {/* 4. Repo breakdown */}
        <ChartPanel
          eyebrow="By repository"
          title="Top Repos"
          badge={`${range}`}
        >
          {repoData.length === 0 ? (
            <p className="trend-empty">No data in this window</p>
          ) : (
            <div className="hbar-list">
              {repoData.map((r) => (
                <HBar
                  key={r.repo}
                  label={r.repo}
                  count={r.count}
                  total={repoMax}
                  color="#4f46e5"
                />
              ))}
            </div>
          )}
        </ChartPanel>

      </div>
    </div>
  );
}
