import Link from "next/link";
import { notFound } from "next/navigation";
import { PipelineDetailsClient } from "./PipelineDetailsClient";
import { supabase } from "@/lib/supabase";
import { rowToPipelineFailure } from "@/lib/pipeline-db";
import type { PipelineFailureRow } from "@/lib/pipeline-db";

async function getPipeline(id: string) {
  const { data, error } = await supabase
    .from("pipeline_failures")
    .select("*")
    .eq("id", decodeURIComponent(id))
    .single();
  if (error || !data) return null;
  return rowToPipelineFailure(data as unknown as PipelineFailureRow);
}

export default async function PipelineDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const failure = await getPipeline(id);
  if (!failure) notFound();

  return (
    <>
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Dashboard</Link>
        <span className="breadcrumb-sep">›</span>
        <span className="breadcrumb-current">{failure.pipelineName}</span>
      </nav>
      <PipelineDetailsClient failure={failure} />
    </>
  );
}
