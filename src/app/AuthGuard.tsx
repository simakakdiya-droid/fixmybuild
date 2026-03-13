"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          paddingTop: "8rem",
          gap: "0.75rem",
          color: "var(--text-muted)",
          fontSize: "0.9375rem",
        }}
      >
        <span
          className="spinner"
          style={{
            border: "2px solid var(--border)",
            borderTopColor: "var(--primary)",
          }}
        />
        Loading dashboard…
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}
