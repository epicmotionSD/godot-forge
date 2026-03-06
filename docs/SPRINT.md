# GodotForge — Sprint Plan

> Sprint 0 · March 2026

---

## Current Sprint: Sprint 0 — Foundation & Validation

**Duration:** March 5 – March 19, 2026 (2 weeks)  
**Goal:** Validate demand, set up core infrastructure, begin MVP development.

---

### Completed

- [x] Landing page live at godot-forge.vercel.app
- [x] Waitlist form functional (Vercel serverless → Supabase)
- [x] Supabase project created, waitlist table + RLS configured
- [x] Vercel project deployed with env vars
- [x] Project docs created (README, ROADMAP, VISION, ARCHITECTURE)
- [x] First r/godot post published — immediate traction
- [x] **Sound Games (Seattle studio) co-founder reached out** — call scheduled for March 6

### Key Validation Signals 🔥

> **March 5:** Within hours of the first Reddit post, the co-founder of Sound Games (Seattle) contacted us and scheduled a call.
>
> **March 6:** Discovery call completed. Sound Games committed to:
> - **Beta testing** GodotForge as a design partner
> - **Name-dropping GodotForge at a gaming conference in San Francisco** (week of March 9)
>
> This is exceptional early traction — a real studio willing to advocate publicly before the product is even built.

### In Progress

- [ ] Post on forum.godotengine.org with technical breakdown
- [ ] First Twitter/X build-in-public thread
- [ ] Join Godot Discord, begin community engagement
- [ ] Prep conference follow-up materials for Sound Games leads

---

## Sprint 1 — Project Setup & Auth (Started March 6)

**Goal:** Next.js app with auth, user dashboard shell, and GitHub OAuth.

- [x] Initialize Next.js 14+ project with TypeScript
- [x] Supabase Auth integration (GitHub + GitLab OAuth)
- [x] User profile table + RLS policies (+ auto-profile trigger on signup)
- [x] Dashboard layout: sidebar, project list (empty state), settings
- [x] Onboarding flow: new project page (repo URL + platform selection)
- [x] Core database schema: profiles, projects, builds, build_logs, artifacts
- [x] Landing page converted to Next.js (React component)
- [x] Waitlist API migrated to App Router
- [x] Build history page, account settings page
- [x] Deploy to Vercel production (godot-forge.vercel.app)
- [x] Environment variables configured (Supabase URL, anon key, service role key)
- [ ] Stripe account setup, subscription model scaffolding

---

## Sprint 2 — Repo Connection & Detection (Completed)

**Goal:** Users can connect a repo and GodotForge detects the Godot project.

- [x] GitHub OAuth token storage (provider_token → profiles.github_token)
- [x] GitHub API utility library (list repos, detect Godot, create webhook)
- [x] Repo listing UI: browse user's GitHub repos with search
- [x] Auto-detect: project.godot path, engine version, export_presets.cfg
- [x] Project creation flow: select repo → auto-detect → configure platforms → save
- [x] Project detail page (info cards, build triggers, recent builds)
- [x] Webhook registration API (registers GitHub webhook on project creation)
- [x] Webhook receiver (verifies HMAC, creates queued build records)
- [ ] ~~GitHub App creation~~ — using OAuth provider_token instead (simpler for MVP)

---

## Sprint 3 — Build System Core (Completed)

**Goal:** Trigger a real Godot export build from the dashboard.

- [x] Dockerfile: Godot 4.x headless + export templates (Windows, Linux, Web)
- [x] Railway API integration for build runners
- [x] Inngest integration: build queue, job creation, step orchestration
- [x] Build trigger: manual "Build Now" button in dashboard
- [x] `godot --headless --export-release` execution in container (build.sh)
- [x] Build status tracking: queued → running → success/failed
- [x] Artifact upload to Supabase Storage + download API
- [x] Build history with artifact download links
- [x] Webhook receiver dispatches to Inngest (auto-builds)
- [x] Supabase Storage bucket + RLS policies for artifacts
- [ ] **Infrastructure setup needed:** Railway account, Inngest account, env vars on Vercel

---

## Sprint 4 — Live Logs & Multi-Platform (April 30 – May 14)

**Goal:** Real-time build logs and parallel multi-platform builds.

- [ ] Supabase Realtime: stream build_logs to dashboard
- [ ] Log viewer component with phase indicators (clone/import/export/deploy)
- [ ] Visual build matrix: toggle platforms in project settings
- [ ] Parallel builds: one container per platform
- [ ] macOS and Android export support
- [ ] Artifact download links in build detail view
- [ ] README status badges (build passing/failing)

---

## Sprint 5 — Deploy Pipeline & Beta Launch (May 14 – May 28)

**Goal:** Steam + itch.io deployment. Invite beta users.

- [ ] Steam deploy: SteamCMD integration (app ID, depot mapping UI)
- [ ] itch.io deploy: Butler integration (API key, game slug UI)
- [ ] Credential storage: encrypted at rest, UI for managing secrets
- [ ] Webhook triggers: auto-build on push, PR, tag
- [ ] Stripe billing: Starter (free) + Indie ($19/mo) go live
- [ ] Build minutes tracking and quota enforcement
- [ ] Invite 50–100 beta users from waitlist
- [ ] Collect feedback, iterate

---

## Backlog (Post-Beta)

- [ ] Custom engine builds (compile from source with custom modules)
- [ ] Build size optimizer (module stripping recommendations)
- [ ] Team collaboration (invite members, RBAC)
- [ ] iOS export (managed macOS runners, certificate management)
- [ ] GUT test framework integration
- [ ] Analytics dashboard (build trends, export sizes)
- [ ] AI build assistant (natural language config via Claude API)
- [ ] MCP server integration
- [ ] GodotForge CLI (npm package)
- [ ] Godot editor plugin
- [ ] Additional store deploys (Epic, GOG, Google Play, web portals)
