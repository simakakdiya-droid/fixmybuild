"use client";

import type { PipelineFailure } from "@/types/pipeline";

const CATEGORIES = [
  { key: "dependency",     label: "Dependency",     icon: "📦", color: "#d97706", bg: "#fffbeb" },
  { key: "code",           label: "Code",           icon: "💻", color: "#4f46e5", bg: "#eef2ff" },
  { key: "configuration",  label: "Configuration",  icon: "⚙️",  color: "#059669", bg: "#ecfdf5" },
  { key: "test",           label: "Test",           icon: "🧪", color: "#7c3aed", bg: "#f5f3ff" },
  { key: "infrastructure", label: "Infrastructure", icon: "🏗️",  color: "#dc2626", bg: "#fef2f2" },
];

export function CategoryChart({ list }: { list: PipelineFailure[] }) {
  if (list.length === 0) return null;

  const counts = list.reduce<Record<string, number>>((acc, item) => {
    const cat = (item.category ?? "code").toLowerCase();
    acc[cat] = (acc[cat] ?? 0) + 1;
    return acc;
  }, {});

  const maxCount = Math.max(...CATEGORIES.map((c) => counts[c.key] ?? 0), 1);

  return (
    <div className="chart-card">
      <div className="chart-header">
        <div>
          <p className="chart-eyebrow">Pattern Recognition</p>
          <h3 className="chart-title">Failure Categories</h3>
        </div>
        <p className="chart-total">{list.length} total</p>
      </div>

      <div className="chart-body">
        {CATEGORIES.map(({ key, label, icon, color, bg }) => {
          const count = counts[key] ?? 0;
          const pct   = list.length ? Math.round((count / list.length) * 100) : 0;
          const width  = Math.round((count / maxCount) * 100);

          return (
            <div key={key} className="chart-row">
              <div className="chart-label-col">
                <span
                  className="chart-cat-badge"
                  style={{ background: bg, color, borderColor: color + "40" }}
                >
                  {icon} {label}
                </span>
              </div>
              <div className="chart-bar-col">
                <div className="chart-track">
                  <div
                    className="chart-fill"
                    style={{ width: `${width}%`, background: color }}
                    role="progressbar"
                    aria-valuenow={count}
                    aria-valuemax={maxCount}
                  />
                </div>
              </div>
              <div className="chart-count-col">
                <span className="chart-count-num" style={{ color }}>{count}</span>
                <span className="chart-count-pct">{pct}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
