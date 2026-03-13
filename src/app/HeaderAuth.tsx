"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";

export function HeaderAuth() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  if (loading) return null;

  if (!user) {
    return (
      <Link
        href="/auth/login"
        style={{
          padding: "0.375rem 0.875rem",
          background: "rgba(255,255,255,0.1)",
          border: "1px solid rgba(255,255,255,0.2)",
          borderRadius: "6px",
          color: "white",
          fontSize: "0.8125rem",
          fontWeight: 600,
          textDecoration: "none",
        }}
      >
        Sign in
      </Link>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
      <span
        style={{
          fontSize: "0.75rem",
          color: "rgba(255,255,255,0.55)",
          maxWidth: "160px",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {user.email}
      </span>
      <button
        onClick={async () => {
          await signOut();
          router.push("/auth/login");
          router.refresh();
        }}
        style={{
          padding: "0.375rem 0.875rem",
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: "6px",
          color: "rgba(255,255,255,0.75)",
          fontSize: "0.8125rem",
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        Sign out
      </button>
    </div>
  );
}
