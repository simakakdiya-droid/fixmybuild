"use client";

import Link from "next/link";
import { useState } from "react";

function ComingSoonBadge() {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.3rem",
        padding: "0.25rem 0.75rem",
        background: "var(--warning-muted)",
        border: "1px solid var(--warning-border)",
        borderRadius: "999px",
        fontSize: "0.75rem",
        fontWeight: 700,
        color: "var(--warning)",
        textTransform: "uppercase",
        letterSpacing: "0.06em",
      }}
    >
      Coming Next
    </span>
  );
}

function ChannelCard({
  icon,
  title,
  desc,
  planned,
}: {
  icon: string;
  title: string;
  desc: string;
  planned: string;
}) {
  return (
    <div
      style={{
        background: "white",
        border: "1px solid var(--border-light)",
        borderRadius: "12px",
        padding: "1.25rem 1.5rem",
        display: "flex",
        gap: "1rem",
        alignItems: "flex-start",
        boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
      }}
    >
      <span style={{ fontSize: "2rem", lineHeight: 1, marginTop: "2px" }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: "0.9375rem",
            fontWeight: 700,
            color: "var(--text)",
            marginBottom: "0.3rem",
          }}
        >
          {title}
        </div>
        <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
          {desc}
        </p>
        <span
          style={{
            fontSize: "0.75rem",
            color: "var(--text-faint)",
            fontStyle: "italic",
          }}
        >
          {planned}
        </span>
      </div>
      <ComingSoonBadge />
    </div>
  );
}

export default function NotificationsPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [triggerResult, setTriggerResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  async function handleTestTrigger(e: React.FormEvent) {
    e.preventDefault();
    setTriggering(true);
    setTriggerResult(null);
    // Stub: simulate a notification trigger for the latest high-severity failure
    await new Promise((r) => setTimeout(r, 1200));
    setTriggering(false);
    setTriggerResult({
      ok: true,
      message:
        "Notification stub triggered successfully. Email/Slack delivery will be wired in the next sprint.",
    });
  }

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Dashboard</Link>
        <span className="breadcrumb-sep">›</span>
        <span className="breadcrumb-current">Notifications</span>
      </nav>

      {/* Header */}
      <div
        className="page-header"
        style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}
      >
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">
            Get alerted on high-severity pipeline failures via Slack or email
          </p>
        </div>
        <ComingSoonBadge />
      </div>

      {/* Roadmap cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem", marginBottom: "2rem" }}>
        <ChannelCard
          icon="✉️"
          title="Email Alerts"
          desc="Receive an email summary whenever a high-severity failure is detected, including the AI root cause and suggested fix."
          planned="Planned: Resend / SendGrid integration, configurable per-repo"
        />
        <ChannelCard
          icon="💬"
          title="Slack Notifications"
          desc="Post a rich Slack message to your #devops or #alerts channel with severity badge, failure summary, and one-click PR link."
          planned="Planned: Slack Incoming Webhooks, configurable channel + mention"
        />
        <ChannelCard
          icon="📣"
          title="Webhook / Custom"
          desc="POST a JSON payload to any URL on every new failure — plug into PagerDuty, OpsGenie, MS Teams, or your own alerting system."
          planned="Planned: Configurable endpoint, secret signing, retry logic"
        />
      </div>

      {/* Test trigger stub */}
      <div className="card">
        <p className="section-label">Test notification trigger</p>
        <h2
          style={{
            fontSize: "1rem",
            fontWeight: 700,
            color: "var(--text)",
            marginBottom: "0.5rem",
          }}
        >
          Trigger a sample high-severity alert
        </h2>
        <p
          style={{
            fontSize: "0.875rem",
            color: "var(--text-muted)",
            marginBottom: "1.25rem",
            lineHeight: 1.6,
          }}
        >
          Enter an email address below and click <strong>Send Test Alert</strong>. This currently
          logs the trigger event — real delivery will be connected once the email/Slack
          integration is wired.
        </p>

        {!submitted ? (
          <form
            onSubmit={handleTestTrigger}
            style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "flex-end" }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem", flex: 1, minWidth: "200px" }}>
              <label
                htmlFor="notif-email"
                style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text)" }}
              >
                Email address
              </label>
              <input
                id="notif-email"
                type="email"
                className="modal-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={triggering}
              style={{ alignSelf: "flex-end" }}
            >
              {triggering ? (
                <><span className="spinner" />Triggering…</>
              ) : (
                "Send Test Alert"
              )}
            </button>
          </form>
        ) : null}

        {triggerResult && (
          <div
            style={{
              marginTop: "1rem",
              padding: "0.875rem 1rem",
              background: triggerResult.ok ? "var(--success-bg)" : "var(--danger-bg)",
              border: `1.5px solid ${triggerResult.ok ? "var(--success-border)" : "var(--danger-border)"}`,
              borderRadius: "7px",
              color: triggerResult.ok ? "var(--success)" : "var(--danger)",
              fontSize: "0.875rem",
              fontWeight: 500,
            }}
            role="status"
          >
            {triggerResult.ok ? "✓ " : "✗ "}
            {triggerResult.message}
          </div>
        )}

        {/* High-severity trigger info */}
        <div
          style={{
            marginTop: "1.5rem",
            padding: "0.875rem 1rem",
            background: "var(--bg-subtle)",
            border: "1px solid var(--border)",
            borderRadius: "7px",
            fontSize: "0.8125rem",
            color: "var(--text-muted)",
            lineHeight: 1.7,
          }}
        >
          <strong style={{ color: "var(--text)" }}>Auto-trigger logic (planned)</strong>
          <br />
          The cron job at <code style={{ fontFamily: "monospace" }}>/api/cron/process-repos</code>{" "}
          already identifies high-severity failures. Once the notification provider is wired, it
          will automatically fire an alert for any failure where{" "}
          <code style={{ fontFamily: "monospace" }}>severity === &quot;high&quot;</code> and{" "}
          <code style={{ fontFamily: "monospace" }}>confidence ≥ 50</code>.
        </div>
      </div>
    </div>
  );
}
