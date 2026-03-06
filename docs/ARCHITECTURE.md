# GodotForge — Technical Architecture

> Last updated: March 2026

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USERS                                   │
│  Godot Devs → Browser Dashboard / Editor Plugin / CLI           │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (Vercel)                             │
│  Next.js + TypeScript                                           │
│  ├── Dashboard (project list, build config, logs, artifacts)    │
│  ├── Onboarding (repo connect, platform selection)              │
│  ├── API routes (serverless functions)                          │
│  └── Edge functions (webhooks, auth callbacks)                  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (Supabase)                            │
│  ├── Auth (GitHub + GitLab OAuth)                               │
│  ├── PostgreSQL (users, projects, builds, artifacts, creds)     │
│  ├── Realtime (live build log streaming)                        │
│  ├── Storage (temporary artifacts, user uploads)                │
│  └── Row Level Security (per-user data isolation)               │
└──────────────────────────┬──────────────────────────────────────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
┌──────────────────┐ ┌──────────┐ ┌──────────────────┐
│   BUILD QUEUE    │ │  BILLING │ │   REPO WEBHOOKS  │
│   (Inngest)      │ │ (Stripe) │ │ (GitHub/GitLab)  │
│                  │ │          │ │                   │
│ Job scheduling   │ │ Subs     │ │ Push events       │
│ Retry logic      │ │ Metering │ │ PR events         │
│ Concurrency      │ │ Invoices │ │ Tag events        │
└────────┬─────────┘ └──────────┘ └───────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                BUILD RUNNERS (Railway / Fly.io)                  │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Docker Container                                        │    │
│  │  ├── Godot 4.x headless binary                          │    │
│  │  ├── Export templates (all platforms, pre-cached)        │    │
│  │  ├── Git clone → project detection → import → export    │    │
│  │  └── Log streaming → Supabase Realtime                  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Parallel builds per platform (Windows, Linux, macOS, Web, Android)│
└────────┬────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DEPLOY TARGETS                                │
│                                                                  │
│  ┌───────────┐  ┌───────────┐  ┌───────────────────────────┐   │
│  │   Steam   │  │  itch.io  │  │   Artifact Storage (S3)   │   │
│  │ SteamCMD  │  │  Butler   │  │   Download links          │   │
│  │ App ID +  │  │  API key  │  │   Badge generation        │   │
│  │ Depot map │  │  + slug   │  │   7/30/90 day retention   │   │
│  └───────────┘  └───────────┘  └───────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack Details

### Frontend

| Technology | Purpose |
|---|---|
| **Next.js 14+** | App router, server components, API routes |
| **TypeScript** | Type safety across the entire codebase |
| **Vercel** | Hosting, edge functions, serverless API |
| **Tailwind CSS** | Rapid UI development |

### Backend

| Technology | Purpose |
|---|---|
| **Supabase** | Auth, PostgreSQL, Realtime, Storage |
| **Inngest** | Build queue management, job scheduling, retries |
| **Stripe** | Subscriptions, usage-based metering, invoicing |

### Build Infrastructure

| Technology | Purpose |
|---|---|
| **Docker** | Pre-built Godot export containers per engine version |
| **Railway / Fly.io** | Managed container orchestration, pay-per-use compute |
| **Godot Headless** | `godot --headless --export-release` for CI builds |
| **godot-ci base images** | Reference for Dockerfile construction |

### Deployment Integrations

| Technology | Purpose |
|---|---|
| **SteamCMD** | Valve's CLI for uploading builds to Steam |
| **Butler** | itch.io's official upload tool |
| **S3-compatible storage** | Artifact hosting and custom deploy targets |

---

## Database Schema (Supabase PostgreSQL)

### Core Tables

```sql
-- Users (managed by Supabase Auth, extended with profile)
create table public.profiles (
  id uuid references auth.users primary key,
  display_name text,
  avatar_url text,
  github_username text,
  gitlab_username text,
  stripe_customer_id text,
  plan text default 'starter',
  build_minutes_used integer default 0,
  build_minutes_limit integer default 100,
  created_at timestamptz default now()
);

-- Projects
create table public.projects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles not null,
  name text not null,
  repo_provider text not null,         -- 'github' | 'gitlab'
  repo_url text not null,
  repo_branch text default 'main',
  godot_version text,                  -- auto-detected, e.g. '4.3'
  project_path text default '.',       -- path to project.godot
  platforms jsonb default '[]',        -- ['windows', 'linux', 'web']
  steam_config jsonb,                  -- { app_id, depot_id, ... }
  itch_config jsonb,                   -- { api_key, game_slug, ... }
  webhook_id text,                     -- GitHub/GitLab webhook ID
  trigger_on_push boolean default true,
  trigger_on_tag boolean default true,
  trigger_on_pr boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Builds
create table public.builds (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects not null,
  user_id uuid references public.profiles not null,
  status text default 'queued',        -- queued | running | success | failed | cancelled
  trigger_type text,                   -- push | tag | pr | manual
  trigger_ref text,                    -- branch name, tag, PR number
  commit_sha text,
  commit_message text,
  platforms jsonb default '[]',        -- platforms built in this run
  duration_seconds integer,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz default now()
);

-- Build Logs (append-only, streamed via Realtime)
create table public.build_logs (
  id bigint generated always as identity primary key,
  build_id uuid references public.builds not null,
  phase text,                          -- clone | import | export | deploy
  platform text,                       -- which platform this log belongs to
  message text not null,
  level text default 'info',           -- info | warn | error
  created_at timestamptz default now()
);

-- Artifacts
create table public.artifacts (
  id uuid default gen_random_uuid() primary key,
  build_id uuid references public.builds not null,
  platform text not null,
  file_name text not null,
  file_size bigint,
  storage_path text not null,          -- S3 key
  download_url text,
  deployed_to text,                    -- 'steam' | 'itch' | null
  expires_at timestamptz,
  created_at timestamptz default now()
);

-- Waitlist (already live)
create table public.waitlist (
  id uuid default gen_random_uuid() primary key,
  email text not null unique,
  source text default 'landing_page',
  created_at timestamptz default now()
);
```

### Row Level Security

All tables enforce RLS. Users can only access their own data:
```sql
-- Example policy for projects
create policy "Users can view own projects"
  on public.projects for select
  using (auth.uid() = user_id);

create policy "Users can insert own projects"
  on public.projects for insert
  with check (auth.uid() = user_id);
```

---

## Build Pipeline Flow

```
1. TRIGGER
   └── Webhook (push/tag/PR) or manual button
       └── Vercel API route validates → enqueues via Inngest

2. QUEUE
   └── Inngest picks up job
       └── Checks user's build minutes quota
       └── Provisions container(s) on Railway — one per platform

3. BUILD (per platform, parallel)
   ├── Clone repo at commit SHA
   ├── Detect project.godot and export_presets.cfg
   ├── Run: godot --headless --import
   ├── Run: godot --headless --export-release "<preset>" output.zip
   ├── Stream logs → Supabase Realtime → Dashboard
   └── Upload artifact → S3

4. DEPLOY (if configured)
   ├── Steam: steamcmd +login +app_build → depot upload
   ├── itch.io: butler push output.zip user/game:channel
   └── Update artifact record with deployment status

5. COMPLETE
   └── Update build status (success/failed)
   └── Increment user's build_minutes_used
   └── Clean up container
```

---

## Key Architecture Decisions

| Decision | Rationale |
|---|---|
| **Clean-room build, not forking W4 source** | W4 source is AGPL — using it would require open-sourcing the SaaS. Build from scratch on our stack. |
| **Railway for v1, dedicated infra later** | Railway handles container orchestration. Migrate to dedicated Kubernetes at scale for cost optimization. |
| **Inngest for build queue** | Already used in KeLatic campaigns. Handles retries, concurrency limits, and timeouts out of the box. |
| **Supabase Realtime for logs** | Native WebSocket streaming. No separate log infrastructure needed for MVP. |
| **Encrypt credentials at rest** | Steam/itch.io credentials stored encrypted. Decrypted only inside build containers. Never logged. |
| **S3 for artifacts, not Supabase Storage** | Artifacts can be large (100MB+ per platform). S3 is cheaper and supports presigned URLs with expiry. |

---

## Security

- **Credentials:** Steam/itch.io secrets encrypted with AES-256 at rest, decrypted only in ephemeral build containers
- **Auth:** Supabase Auth with GitHub/GitLab OAuth. No password-based auth.
- **RLS:** Every table enforced. Users see only their own data.
- **Webhooks:** Verified via HMAC signature (GitHub) or secret token (GitLab)
- **Build isolation:** Each build runs in a fresh, ephemeral container — no state leakage between builds
- **API keys:** Vercel serverless functions use env vars, never exposed to the client
