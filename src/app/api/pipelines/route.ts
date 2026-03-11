import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { rowToPipelineFailure } from "@/lib/pipeline-db";
import type { PipelineFailureRow } from "@/lib/pipeline-db";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("pipeline_failures")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    const list = (data ?? []).map((row) => rowToPipelineFailure(row as unknown as PipelineFailureRow));
    return NextResponse.json(list);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to list pipelines" },
      { status: 500 }
    );
  }
}
