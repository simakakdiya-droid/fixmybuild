# Security Policy

## Secret Handling

### Server-side secrets (never exposed to browser)

| Secret | Variable | Scope |
|---|---|---|
| Supabase service role key | `SUPABASE_SERVICE_ROLE_KEY` | API routes only — bypasses RLS |
| GitHub Personal Access Token | `GITHUB_TOKEN` | API routes + cron only |
| Groq API key | `OPENAI_API_KEY` | API routes only |
| Cron secret | `CRON_SECRET` | Cron route header validation only |

**Enforcement:** None of the above variables have a `NEXT_PUBLIC_` prefix. Next.js only bundles env vars with that prefix into the client JavaScript bundle. All server-only secrets are read exclusively in `src/lib/supabase.ts`, `src/lib/groq.ts`, `src/lib/github.ts`, and API route handlers — no imports of these modules exist in any `"use client"` component.

### Browser-safe keys

| Key | Variable | Why safe |
|---|---|---|
| Supabase URL | `NEXT_PUBLIC_SUPABASE_URL` | Public endpoint |
| Supabase anon key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Row-Level Security enforces access control |

## Token Scopes

**GitHub PAT (`GITHUB_TOKEN`):**
- `repo` — read repository content, create branches and PRs
- `actions` — read workflow runs and download log artifacts

Principle of least privilege: only these two scopes are needed. The token should be scoped to the specific repositories in `GITHUB_REPOS` where possible (use fine-grained PATs in GitHub settings).

**Supabase service role key:**
Used only in server-side API routes to read/write the `pipeline_failures` table. It bypasses Row-Level Security (RLS) — therefore it must never reach the browser. The `src/lib/supabase.ts` module is imported only from server components and API route files.

**Supabase anon key:**
Used only in `src/lib/supabase-browser.ts` for Supabase Auth (sign-in/sign-up/sign-out). Database access via the anon key is blocked unless you enable permissive RLS policies — by default, Supabase denies all anon data access.

## Cron Protection

The `/api/cron/process-repos` route accepts requests only when:

1. The `x-vercel-cron: 1` header is present (set automatically by Vercel Cron), **or**
2. The `Authorization: Bearer <CRON_SECRET>` header matches the `CRON_SECRET` environment variable

Without either, the route returns `401 Unauthorized`.

## Input Validation

- **`/api/pipelines/analyze`**: `owner`, `repo`, and `runId` are validated — `runId` must be a positive integer, `owner`/`repo` are passed directly to the GitHub API (which enforces its own validation).
- **`/api/pipelines/create-pr`**: `pipelineFailureId` is looked up in the database before any GitHub call is made. If not found, the route returns `404`.
- **Confidence gate**: PR creation is blocked for analyses with `confidence < 70` unless explicitly overridden. This prevents low-quality AI suggestions from being pushed to repositories automatically.
- **Log truncation**: Pipeline logs are truncated before being sent to Groq to avoid prompt injection via extremely large log files.

## Authentication

Routes are protected by Supabase Auth (JWT). The dashboard and pipeline detail pages require an authenticated session — unauthenticated users are redirected to `/auth/login`.

API routes (`/api/*`) are intentionally public for demo purposes and internal cron use. In a production deployment, add session-based or API-key-based auth guards to all API routes.

## Reporting a Vulnerability

Please report security issues by opening a private GitHub Security Advisory at:
[github.com/simakakdiya-droid/fixmybuild/security/advisories/new](https://github.com/simakakdiya-droid/fixmybuild/security/advisories/new)

Do not open a public GitHub Issue for security vulnerabilities.
