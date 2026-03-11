# FixMyBuild (Next.js + Supabase)

SaaS app for analyzing failed GitHub Actions runs with AI (Groq) and creating fix PRs. Built with Next.js 15, Supabase, and deployed on Vercel.

## Setup

### Prerequisites

- Node.js 18+
- npm

### 1. Clone and install

```bash
cd next-app
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in:

- **GITHUB_TOKEN** – GitHub personal access token (repo + actions scope)
- **OPENAI_API_KEY** – Groq API key (used for log analysis)
- **SUPABASE_URL** – `https://olsudkakojivihbzzpho.supabase.co`
- **SUPABASE_SERVICE_ROLE_KEY** – From Supabase Project Settings → API
- **GITHUB_REPOS** – Comma-separated `owner/repo` (e.g. `Seema2211/fixmybuild-test-repo`)
- **CRON_SECRET** (optional) – For protecting the cron endpoint

### 3. Supabase table

Ensure the `pipeline_failures` table exists with columns matching `supabase/schema.sql` (see that file for reference).

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Dashboard lists pipeline failures; click “View Fix” for details and “Generate Fix PR” to create a PR.

### 5. Vercel deployment

- Import the GitHub repo ([simakakdiya-droid/fixmybuild](https://github.com/simakakdiya-droid/fixmybuild)) in Vercel.
- Set **Root Directory** to `next-app` if the app lives in that folder.
- Add all environment variables in Project → Settings → Environment Variables.
- Deploy. Cron is configured in `vercel.json` to hit `/api/cron/process-repos` every 5 minutes.

## API

- `GET /api/pipelines` – List pipeline failures
- `GET /api/pipelines/[id]` – Get one failure
- `POST /api/pipelines/analyze` – Body: `{ owner, repo, runId }` – analyze a run and store
- `POST /api/pipelines/create-pr` – Body: `{ pipelineFailureId, repoOwner, repoName, branchName? }` – create fix PR
- `GET /api/cron/process-repos` – Called by Vercel Cron; processes `GITHUB_REPOS` and optionally auto-creates PRs when confidence ≥ 70%

## Repo

[https://github.com/simakakdiya-droid/fixmybuild](https://github.com/simakakdiya-droid/fixmybuild)
