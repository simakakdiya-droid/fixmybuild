import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { rowToPipelineFailure } from "@/lib/pipeline-db";
import type { PipelineFailureRow } from "@/lib/pipeline-db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { data, error } = await supabase
      .from("pipeline_failures")
      .select("*")
      .eq("id", decodeURIComponent(id))
      .single();
    if (error || !data) {
      return NextResponse.json(
        { error: "Pipeline failure not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(rowToPipelineFailure(data as unknown as PipelineFailureRow));
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to get pipeline" },
      { status: 500 }
    );
  }
}
