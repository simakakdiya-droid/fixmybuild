import { supabase } from "@/lib/supabase";
import { rowToPipelineFailure } from "@/lib/pipeline-db";
import type { PipelineFailureRow } from "@/lib/pipeline-db";
import { DashboardClient } from "./DashboardClient";

async function getPipelines() {
  const { data, error } = await supabase
    .from("pipeline_failures")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => rowToPipelineFailure(row as unknown as PipelineFailureRow));
}

export default async function DashboardPage() {
  let list: Awaited<ReturnType<typeof getPipelines>> = [];
  let error: string | null = null;
  try {
    list = await getPipelines();
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load";
  }

  if (error) {
    return (
      <div className="card">
        <div className="empty-state">
          <span className="empty-state-icon">⚠️</span>
          <p className="empty-state-title">Failed to load pipelines</p>
          <p className="empty-state-body" style={{ color: "var(--danger)" }}>{error}</p>
        </div>
      </div>
    );
  }

  return <DashboardClient list={list} />;
}
