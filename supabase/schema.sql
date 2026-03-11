-- Reference schema for pipeline_failures (Supabase FixMyBuild project).
-- Run in Supabase SQL Editor if the table does not exist yet.

create table if not exists public.pipeline_failures (
  id text primary key,
  pipeline_name text not null default '',
  status text not null default 'failure',
  error_log text not null default '',
  failed_stage text,
  error_summary text,
  root_cause text not null default '',
  category text,
  fix_suggestion text not null default '',
  key_error_lines jsonb default '[]'::jsonb,
  severity text,
  confidence integer not null default 0,
  explanation text not null default '',
  command text not null default '',
  created_at timestamptz not null default now(),
  repo_owner text,
  repo_name text,
  run_id bigint,
  created_pull_request jsonb
);

-- Optional: index for listing by created_at
create index if not exists idx_pipeline_failures_created_at
  on public.pipeline_failures (created_at desc);
