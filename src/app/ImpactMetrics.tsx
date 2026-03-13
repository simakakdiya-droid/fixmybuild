"use client";

import type { PipelineFailure } from "@/types/pipeline";

// Conservative estimates — used to compute ROI numbers
const HOURS_TO_DEBUG = 2.5;   // avg dev hours to manually triage one CI failure
const HOURS_TO_PR = 1.0;      // avg dev hours to write + open a fix PR manually

export function ImpactMetrics({ list }: { list: PipelineFailure[] }) {
  if (list.length === 0) return null;

  const totalAnalyzed = list.length;
  const autoPRs       = list.filter((r) => r.createdPullRequest).length;
  const highConf      = list.filter((r) => r.confidence >= 70).length;
  const manualHrs     = Math.round(totalAnalyzed * HOURS_TO_DEBUG + autoPRs * HOURS_TO_PR * 3);
  const aiHrs         = Math.round(totalAnalyzed * 0.05 + autoPRs * HOURS_TO_PR * 0.1); // near-zero
  const savedHrs      = manualHrs - aiHrs;

  const cards: {
    label: string;
    icon: string;
    color: string;
    bg: string;
    border: string;
    beforeValue: string;
    beforeSub: string;
    afterValue: string | number;
    afterSub: string;
  }[] = [
    {
      label:       "Failures Analyzed",
      icon:        "🔍",
      color:       "#4f46e5",
      bg:          "#eef2ff",
      border:      "#c7d2fe",
      beforeValue: "Manual triage",
      beforeSub:   "hours per failure",
      afterValue:  totalAnalyzed,
      afterSub:    "auto-analyzed by AI",
    },
    {
      label:       "Fix PRs Created",
      icon:        "🔀",
      color:       "#059669",
      bg:          "#ecfdf5",
      border:      "#a7f3d0",
      beforeValue: "0 automated",
      beforeSub:   "all manual",
      afterValue:  autoPRs,
      afterSub:    `${highConf} with ≥70% confidence`,
    },
    {
      label:       "Est. Dev Hours Saved",
      icon:        "⏱️",
      color:       "#d97706",
      bg:          "#fffbeb",
      border:      "#fde68a",
      beforeValue: `~${manualHrs}h`,
      beforeSub:   "without FixMyBuild",
      afterValue:  `~${savedHrs}h`,
      afterSub:    `saved @ ${HOURS_TO_DEBUG}h avg per fix`,
    },
  ];

  return (
    <div className="impact-section">
      <div className="impact-eyebrow">Before vs After · FixMyBuild AI Impact</div>
      <div className="impact-grid">
        {cards.map((c) => (
          <div
            key={c.label}
            className="impact-card"
            style={
              {
                "--ic": c.color,
                "--ic-bg": c.bg,
                "--ic-border": c.border,
              } as React.CSSProperties
            }
          >
            <div className="impact-card-top">
              <span className="impact-icon">{c.icon}</span>
              <span className="impact-label">{c.label}</span>
            </div>

            <div className="impact-compare">
              {/* Before */}
              <div className="impact-before">
                <span className="impact-before-tag">Before</span>
                <span className="impact-before-val">{c.beforeValue}</span>
                <span className="impact-sub">{c.beforeSub}</span>
              </div>

              {/* Arrow */}
              <div className="impact-arrow" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>

              {/* After */}
              <div className="impact-after">
                <span className="impact-after-tag">After</span>
                <span className="impact-after-val">{c.afterValue}</span>
                <span className="impact-sub">{c.afterSub}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
