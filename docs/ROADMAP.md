# GodotForge — Product Roadmap

> Last updated: March 6, 2026

---

## Overview

GodotForge follows a phased approach: MVP → Growth → Platform. Each phase builds on community feedback and usage data.

---

## Phase 1: MVP (Weeks 1–10)

**Goal:** Functional CI/CD that a Godot dev can use end-to-end.

### Milestone 1.1 — Foundation (Weeks 1–3) ✅
- [x] Next.js + TypeScript project setup (Vercel deployment)
- [x] Supabase auth (GitHub OAuth)
- [x] User dashboard shell (project list, settings, onboarding)
- [x] Database schema: profiles, projects, builds, build_logs, artifacts — applied via Supabase MCP
- [x] Full RLS policies, auto-profile trigger, build duration trigger, Realtime publication

### Milestone 1.2 — Repo Connection & Detection (Weeks 3–5) ✅
- [x] GitHub OAuth flow, repo listing, webhook registration
- [ ] GitLab App: OAuth flow, repo listing, webhook registration *(deferred to Phase 2)*
- [x] Auto-detect: `project.godot` location, engine version, `export_presets.cfg`
- [x] Project config UI: confirm detected settings, override engine version

### Milestone 1.3 — Build System (Weeks 5–7) ✅
- [x] Docker containers with Godot 4.x export templates pre-installed
- [x] Build runner orchestration on Railway (API validated, project "optimistic-endurance")
- [x] Build queue management via Inngest (validated: function discovered, keys valid)
- [x] `godot --headless --export-release` per platform
- [x] Visual build matrix: toggle Windows, Linux, macOS, Web, Android *(Sprint 4)*
- [x] Real-time build log streaming via Supabase Realtime *(Sprint 4)*
- [x] Parallel builds: one container per platform via Inngest fan-out *(Sprint 4)*
- [x] Build cancellation via Inngest cancelOn + cancel API *(Sprint 5)*

### Milestone 1.4 — Deploy Pipeline (Weeks 7–9)
- [x] Artifact storage (Supabase Storage bucket) + signed download URLs
- [ ] Steam deployment via SteamCMD (app ID + depot mapping config)
- [ ] itch.io deployment via Butler (API key + game slug config)
- [ ] Credential encryption at rest for Steam/itch.io secrets

### Milestone 1.5 — Polish & Beta Prep (Weeks 9–10)
- [x] Build history view with status, duration, artifact links
- [x] README status badges (build passing/failing) *(Sprint 4)*
- [x] Webhook triggers: auto-build on push, PR, or tag creation
- [x] Manual trigger button in dashboard
- [x] Build cancellation UI (cancel button on queued/running builds) *(Sprint 5)*
- [x] Error handling: settings save failures with user-visible messages *(Sprint 5)*
- [x] Vercel production env vars: all 9 configured (Supabase, Inngest, Railway)
- [ ] Stripe integration: Starter (free) + Indie ($19/mo) tiers
- [ ] Landing page updates, waitlist → beta access conversion
- [ ] **Dogfooding:** Internal test with Roadblocs (Godot 4.6 game) — requires GitHub push + export presets + Godot 4.6 Docker image

---

## Phase 2: Growth (Months 3–6)

**Goal:** Features that retain users and unlock Studio tier revenue.

### Milestone 2.1 — Custom Engine Builds
- [ ] Compile Godot from source with custom modules
- [ ] Optimization flags and stripped features for smaller binaries
- [ ] Build size optimizer: recommend modules to strip (30–50% smaller exports)

### Milestone 2.2 — Team Collaboration
- [ ] Invite team members via email
- [ ] Role-based access control (admin, developer, viewer)
- [ ] Shared build configs across team
- [ ] Audit logs for builds and config changes

### Milestone 2.3 — iOS Export
- [ ] Managed macOS build runners
- [ ] Certificate and provisioning profile management
- [ ] TestFlight deployment integration

### Milestone 2.4 — Automated Testing
- [ ] GUT (Godot Unit Testing) framework support
- [ ] Custom test suite execution before export
- [ ] Fail builds on test failures
- [ ] Test result reporting in dashboard

### Milestone 2.5 — Analytics Dashboard
- [ ] Build time trends over time
- [ ] Export size tracking per platform
- [ ] Platform coverage metrics
- [ ] Usage and cost breakdowns

---

## Phase 3: Platform (Months 6–12)

**Goal:** Become the Godot developer platform, not just CI/CD.

### Milestone 3.1 — AI Build Assistant
- [ ] Natural language build configuration
- [ ] Example: "Build for Steam and itch.io on every push to main, skip web builds on PRs"
- [ ] Powered by Claude API with GDScript-aware context

### Milestone 3.2 — MCP Server Integration
- [ ] Expose GodotForge as an MCP server
- [ ] AI agents trigger builds, check status, download artifacts via natural language
- [ ] Claude Desktop integration

### Milestone 3.3 — Trust Stack Integration (OpenConductor)
- [ ] On-chain build attestation
- [ ] Prove game binary matches source code
- [ ] Agent identity for automated builds

### Milestone 3.4 — Marketplace Expansion
- [ ] Epic Games Store deployment
- [ ] GOG deployment
- [ ] Google Play deployment
- [ ] Web portals: Poki, CrazyGames

### Milestone 3.5 — GodotForge CLI
- [ ] npm package for triggering builds from terminal
- [ ] Integrates with existing dev workflows and scripts
- [ ] CI/CD pipeline integration (use GodotForge from GitHub Actions)

### Milestone 3.6 — Godot Editor Plugin
- [ ] In-editor build status panel
- [ ] One-click deploy from the editor
- [ ] Build history browser
- [ ] Published to Godot Asset Library

---

## Revenue Milestones

| Milestone | Target | Timeline |
|---|---|---|
| First 100 waitlist signups | Community validation | Month 1 |
| Beta launch (50–100 users) | Product validation | Month 2 |
| Public launch | Growth begins | Month 3 |
| $5K–$10K MRR | 250–500 Indie subscribers | Year 1 |
| $25K–$50K MRR | Studio tier + Enterprise | Year 2 |
| $100K+ MRR | Platform effects, API, AI features | Year 3 |

---

## Key Dates

| Date | Event |
|---|---|
| March 2026 | Waitlist live, development begins |
| April 2026 | Closed beta (50–100 devs) |
| May 2026 | Public beta launch |
| June 2026 | Phase 2 features begin |
| September 2026 | Phase 3 features begin |
| March 2027 | Full platform vision |
