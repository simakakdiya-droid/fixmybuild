import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { rowToPipelineFailure } from "@/lib/pipeline-db";
import type { PipelineFailureRow } from "@/lib/pipeline-db";

async function getPipelines() {
  const { data, error } = await supabase
    .from("pipeline_failures")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => rowToPipelineFailure(row as unknown as PipelineFailureRow));
}

function SeverityBadge({ severity }: { severity?: string | null }) {
  const s = (severity ?? "").toLowerCase();
  const cls =
    s === "high"
      ? "badge severity-high"
      : s === "low"
        ? "badge severity-low"
        : "badge severity-medium";
  return (
    <span className={cls}>
      {(severity ?? "—").toUpperCase()}
    </span>
  );
}

export default async function DashboardPage() {
  let list: Awaited<ReturnType<typeof getPipelines>> = [];
  let error: string | null = null;
  try {
    list = await getPipelines();
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load";
  }

  return (
    <div className="card">
      <h1 style={{ marginBottom: "0.35rem" }}>Pipeline Failures</h1>
      <p className="empty" style={{ marginBottom: "1rem" }}>
        Failed GitHub Actions runs with AI analysis
      </p>
      {error && <p className="empty" style={{ color: "#c62828" }}>{error}</p>}
      {!error && list.length === 0 && (
        <p className="empty">
          No pipeline failures in cache. Configure GITHUB_REPOS and wait for the
          cron, or trigger analysis manually.
        </p>
      )}
      {!error && list.length > 0 && (
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
              {list.map((row) => (
                <tr key={row.id}>
                  <td>{row.pipelineName}</td>
                  <td>{row.failedStage ?? "—"}</td>
                  <td>
                    <span
                      className={
                        row.status === "failure" ? "badge badge-failure" : "badge"
                      }
                    >
                      {row.status}
                    </span>
                  </td>
                  <td>
                    <SeverityBadge severity={row.severity} />
                  </td>
                  <td>{row.rootCause ?? "—"}</td>
                  <td>{row.confidence}%</td>
                  <td>
                    {row.createdPullRequest?.htmlUrl ? (
                      <a
                        href={row.createdPullRequest.htmlUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View PR
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    <Link
                      href={`/pipelines/${encodeURIComponent(row.id)}`}
                      className="btn btn-primary"
                    >
                      View Fix
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
