# FixMyBuild AI

> AI-powered GitHub Actions failure analyzer — detects root causes, generates fix suggestions, and automatically opens pull requests.

Built with **Next.js 15 (App Router)**, **Supabase**, **Groq LLM (llama-3.3-70b-versatile)**, and deployed on **Vercel**.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                              │
│   React (Next.js App Router)  ←  Supabase Anon Key (auth)  │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS
┌──────────────────────────▼──────────────────────────────────┐
│                     Vercel Edge / Node                        │
│                                                               │
│  /api/pipelines           – list + detail (Supabase)         │
│  /api/pipelines/analyze   – GitHub ZIP logs → Groq → DB      │
│  /api/pipelines/create-pr – confidence gate → GitHub PR      │
│  /api/cron/process-repos  – Vercel Cron (daily midnight UTC) │
│  /api/demo/seed           – seed demo data                   │
└──────┬──────────────────┬───────────────┬────────────────────┘
       │                  │               │
  ┌────▼────┐      ┌──────▼──────┐  ┌────▼──────┐
  │ Supabase│      │  Groq LLM   │  │  GitHub   │
  │Postgres │      │llama-3.3-70b│  │  REST API │
  └─────────┘      └─────────────┘  └───────────┘
```

**Data flow for a failed run:**

1. Vercel Cron hits `/api/cron/process-repos` → fetches failed GitHub Actions runs
2. Downloads the ZIP log artifact → extracts error lines (`zip.ts`)
3. Sends error log to Groq → receives structured JSON analysis
4. Saves to `pipeline_failures` table in Supabase
5. If `confidence ≥ 70`, auto-creates a fix PR on GitHub

---

## Setup

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Groq](https://console.groq.com) API key
- A GitHub Personal Access Token (`repo` + `actions` scopes)

### 1. Clone and install

```bash
git clone https://github.com/simakakdiya-droid/fixmybuild.git
cd fixmybuild/next-app
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL (safe for browser) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon key (safe for browser) |
| `SUPABASE_URL` | ✅ | Same value as above (server-side alias) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | **Server-only** service role key — never expose to client |
| `GITHUB_TOKEN` | ✅ | PAT with `repo` + `actions` scopes |
| `GITHUB_REPOS` | ✅ | Comma-separated `owner/repo` list e.g. `myorg/myrepo` |
| `OPENAI_API_KEY` | ✅ | Groq API key (used at Groq's OpenAI-compatible endpoint) |
| `CRON_SECRET` | optional | Bearer token for manual cron calls |

### 3. Supabase schema

Run the schema in your Supabase SQL editor:

```sql
create table pipeline_failures (
  id                  text primary key,
  pipeline_name       text not null,
  status              text not null default 'failure',
  error_log           text,
  failed_stage        text,
  error_summary       text,
  root_cause          text,
  category            text,
  fix_suggestion      text,
  key_error_lines     text[],
  severity            text,
  confidence          int default 0,
  explanation         text,
  command             text,
  repo_owner          text,
  repo_name           text,
  run_id              bigint,
  created_pull_request jsonb,
  created_at          timestamptz default now()
);
```

Also create a demo auth user (for sign-in demo):

1. Go to Supabase → Authentication → Users → Invite user
2. Email: `demo@fixmybuild.ai` / Password: `Demo1234!`

### 4. Seed demo data

```bash
# Once the app is running:
curl -X POST http://localhost:3000/api/demo/seed
# Or click "Try Demo" in the dashboard
```

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 6. Tests

```bash
npm test
```

---

## Demo credentials

| Field | Value |
|---|---|
| URL | https://fixmybuild.vercel.app |
| Email | `demo@fixmybuild.ai` |
| Password | `Demo1234!` |

> Note: Create this user in your Supabase Auth dashboard before the demo.

---

## Deployment (Vercel)

1. Import repo at [vercel.com/new](https://vercel.com/new)
2. Set **Root Directory** to `next-app`
3. Add all environment variables under Project → Settings → Environment Variables
4. Deploy — the cron (`vercel.json`) runs `/api/cron/process-repos` daily at midnight UTC

---

## API Reference

| Method | Endpoint | Body / Params | Description |
|---|---|---|---|
| `GET` | `/api/pipelines` | — | List all failures |
| `GET` | `/api/pipelines/[id]` | — | Single failure detail |
| `POST` | `/api/pipelines/analyze` | `{ owner, repo, runId }` | Fetch logs → AI analysis → save |
| `POST` | `/api/pipelines/create-pr` | `{ pipelineFailureId, repoOwner, repoName }` | Create fix PR (confidence ≥ 70) |
| `GET` | `/api/cron/process-repos` | `Authorization: Bearer $CRON_SECRET` | Cron: process all repos |
| `POST` | `/api/demo/seed` | — | Insert sample pipeline failures |

---

## Links

- Repo: [github.com/simakakdiya-droid/fixmybuild](https://github.com/simakakdiya-droid/fixmybuild)
- Demo: [fixmybuild.vercel.app](https://fixmybuild.vercel.app)
- SECURITY: [SECURITY.md](./SECURITY.md)
