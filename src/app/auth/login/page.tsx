"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getSupabaseBrowser,
  missingSupabaseBrowserEnvMessage,
} from "@/lib/supabase-browser";

function LogoIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="30" height="30" rx="8" fill="url(#loginLogoGrad)" />
      <path d="M17.5 4.5L10 15.5h6L13.5 25.5L23 13H17L17.5 4.5Z" fill="white" />
      <defs>
        <linearGradient id="loginLogoGrad" x1="0" y1="0" x2="30" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366f1" />
          <stop offset="1" stopColor="#a855f7" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();
  const hasSupabaseBrowserEnv =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      const supabaseBrowser = getSupabaseBrowser();

      if (mode === "signup") {
        const { error } = await supabaseBrowser.auth.signUp({ email, password });
        if (error) { setError(error.message); return; }
        setSuccess("Account created! Check your email to confirm, then sign in.");
        setMode("login");
        setPassword("");
      } else {
        const { error } = await supabaseBrowser.auth.signInWithPassword({ email, password });
        if (error) { setError(error.message); return; }
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setSubmitting(false);
    }
  }

  function switchMode(next: "login" | "signup") {
    setMode(next);
    setError(null);
    setSuccess(null);
  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "60vh",
        padding: "2rem 1rem",
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: "16px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.09), 0 1px 4px rgba(0,0,0,0.05)",
          border: "1px solid var(--border-light)",
          padding: "2.5rem 2rem",
          width: "100%",
          maxWidth: "400px",
        }}
      >
        {/* Logo + title */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
            <LogoIcon />
          </div>
          <h1
            style={{
              fontSize: "1.375rem",
              fontWeight: 800,
              color: "var(--text)",
              letterSpacing: "-0.02em",
              marginBottom: "0.375rem",
            }}
          >
            {mode === "login" ? "Welcome back" : "Create account"}
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
            {mode === "login" ? "Sign in to FixMyBuild AI" : "Start fixing pipelines with AI"}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              padding: "0.75rem 1rem",
              background: "var(--danger-bg)",
              border: "1.5px solid var(--danger-border)",
              borderRadius: "7px",
              color: "var(--danger)",
              fontSize: "0.875rem",
              marginBottom: "1.25rem",
            }}
            role="alert"
          >
            {error}
          </div>
        )}

        {!hasSupabaseBrowserEnv && (
          <div
            style={{
              padding: "0.75rem 1rem",
              background: "var(--danger-bg)",
              border: "1.5px solid var(--danger-border)",
              borderRadius: "7px",
              color: "var(--danger)",
              fontSize: "0.875rem",
              marginBottom: "1.25rem",
            }}
            role="alert"
          >
            {missingSupabaseBrowserEnvMessage}
          </div>
        )}

        {/* Success */}
        {success && (
          <div
            style={{
              padding: "0.75rem 1rem",
              background: "var(--success-bg)",
              border: "1.5px solid var(--success-border)",
              borderRadius: "7px",
              color: "var(--success)",
              fontSize: "0.875rem",
              marginBottom: "1.25rem",
            }}
            role="status"
          >
            {success}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
            <label
              htmlFor="auth-email"
              style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text)" }}
            >
              Email
            </label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="modal-input"
              autoComplete="email"
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
            <label
              htmlFor="auth-password"
              style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text)" }}
            >
              Password
            </label>
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={mode === "signup" ? 6 : undefined}
              placeholder={mode === "signup" ? "Min 6 characters" : "••••••••"}
              className="modal-input"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !hasSupabaseBrowserEnv}
            className="btn btn-primary"
            style={{ width: "100%", justifyContent: "center", marginTop: "0.25rem" }}
          >
            {submitting ? (
              <><span className="spinner" />Loading…</>
            ) : mode === "login" ? (
              "Sign in"
            ) : (
              "Create account"
            )}
          </button>
        </form>

        {/* Toggle mode */}
        <div
          style={{
            textAlign: "center",
            marginTop: "1.5rem",
            fontSize: "0.875rem",
            color: "var(--text-muted)",
          }}
        >
          {mode === "login" ? (
            <>
              No account?{" "}
              <button
                type="button"
                onClick={() => switchMode("signup")}
                style={{
                  color: "var(--primary)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "inherit",
                  padding: 0,
                }}
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have one?{" "}
              <button
                type="button"
                onClick={() => switchMode("login")}
                style={{
                  color: "var(--primary)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "inherit",
                  padding: 0,
                }}
              >
                Sign in
              </button>
            </>
          )}
        </div>

        {/* Demo credentials */}
        {mode === "login" && (
          <div
            style={{
              marginTop: "1.25rem",
              padding: "0.875rem 1rem",
              background: "var(--bg-subtle)",
              border: "1px solid var(--border)",
              borderRadius: "7px",
              fontSize: "0.8125rem",
              color: "var(--text-muted)",
              lineHeight: 1.7,
            }}
          >
            <strong style={{ color: "var(--text)", display: "block", marginBottom: "0.25rem" }}>
              Demo credentials
            </strong>
            Email:{" "}
            <code style={{ fontFamily: "ui-monospace, monospace", fontSize: "0.8125rem" }}>
              demo@fixmybuild.ai
            </code>
            <br />
            Password:{" "}
            <code style={{ fontFamily: "ui-monospace, monospace", fontSize: "0.8125rem" }}>
              Demo1234!
            </code>
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: "1.25rem" }}>
          <Link
            href="/"
            style={{ fontSize: "0.8125rem", color: "var(--text-faint)", textDecoration: "none" }}
          >
            ← Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
