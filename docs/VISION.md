# GodotForge — Product Vision & Strategy

> Sonnier Ventures · March 2026

---

## The Opportunity

### What Happened

On December 20, 2025, W4 Games killed **W4 Build** — their cloud-based CI/CD platform purpose-built for Godot Engine. Users were given until January 2026 to migrate. The core tech was open-sourced under AGPL on GitLab, but the managed service is gone.

**No one has stepped in to fill the gap.**

### What W4 Build Was

A managed cloud CI that let Godot devs:
- Build custom engine compilations
- Export games to Windows/Linux/macOS/Android/iOS/Web
- Trigger builds via GitHub/GitLab webhooks
- Deploy artifacts to Steam/itch.io/S3
- Manage build matrices across platforms
- Collaborate with team members

It was the **only** Godot-specific managed CI/CD service.

### Current Landscape

| Solution | Limitation |
|---|---|
| **godot-ci (abarichello)** | Docker image + GitHub Actions templates. Free, DIY, no dashboard, no managed infra. 2.6K+ stars. |
| **Codemagic** | Generic mobile CI/CD. Supports Godot as one of many engines. Not optimized. |
| **Manual GitHub/GitLab CI** | Custom YAML configs. Error-prone, time-consuming, no UI. |
| **W4 Build AGPL Source** | Open-sourced but requires self-hosting. Most indie devs won't run their own CI infra. |

### Market Size

| Metric | Value |
|---|---|
| Godot games on Steam | **5,300+** (growing 69% YoY) |
| User base growth | **2x** in a single month after Unity controversy |
| New Godot Steam games by Aug 2025 | **394+** (surpassed all of 2024) |
| Revenue share Godot takes | **$0** (MIT license) |
| Managed Godot CI/CD services available | **0** |

---

## Product Vision

### One-Liner

GodotForge is the managed CI/CD platform built exclusively for Godot developers — connect your repo, pick your platforms, and ship. No Docker configs. No YAML wrestling. No DevOps degree required.

### Core Value Proposition

Game developers want to make games, not manage build infrastructure. Every hour spent debugging a GitHub Actions workflow is an hour not spent on gameplay. GodotForge eliminates that friction entirely — it speaks Godot natively, understands export presets, handles platform-specific signing, and deploys directly to the stores where players buy games.

---

## Go-to-Market Strategy

### Phase 1: Build in Public (Weeks 1–4)

- **r/godot announcement** — "W4 Build is dead — I'm building the replacement. Here's my plan." (300K+ members)
- **Godot Forum post** — Technical breakdown on forum.godotengine.org. Engage with existing W4 Build shutdown threads.
- **Twitter/X threads** — Weekly build-in-public updates. Tag @W4Games, Godot maintainers. Show real progress.
- **Discord presence** — Join official Godot Discord (100K+ members) and game dev Discords. Help people with CI/CD while building.

### Phase 2: Beta Launch (Weeks 5–8)

- **Closed beta** — 50–100 devs from Reddit/forum engagement. Free Indie tier for 6 months in exchange for feedback + testimonials.
- **Integration partners** — Godot YouTube creators (Brackeys, GDQuest, HeartBeast). Free Studio tier.
- **GitHub Action wrapper** — Free Action that wraps GodotForge API — captures devs already using godot-ci who want something better.

### Phase 3: Public Launch (Weeks 9–12)

- **Hacker News** — "Show HN: GodotForge — Managed CI/CD for the fastest-growing game engine"
- **Product Hunt** — Demo video showing git push → playable Steam build in under 5 minutes.
- **Godot Asset Library** — Free plugin that adds a "Deploy" button in the Godot editor.
- **Content marketing** — Blog posts: "How to Ship Your Godot Game to Steam in 5 Minutes", "Why Game Devs Shouldn't Write YAML"

### Phase 4: Ecosystem Lock-in (Months 4–12)

- **Godot editor plugin** — In-editor build status, one-click deploy, build history. This is the moat.
- **Game jam sponsorships** — Ludum Dare, GMTK Game Jam, Godot Wild Jam. Free build minutes at the moment devs start a project.
- **GodotCon presence** — Sponsor and speak. W4 was the dominant presence — now there's a void.
- **Partnership pipeline** — Poki, CrazyGames for web deployment. Nakama/PlayFab for backend deploys alongside game deploys.

---

## Competitive Moat

### Why W4 Failed at This

W4 Games raised $23.5M and spread across console ports, CI/CD, cloud multiplayer, XR toolkits, and enterprise services. They couldn't focus. CI/CD was their least defensible product — it's infrastructure, not IP. They killed it to focus on consoles and enterprise. But they **validated the need and left the market**.

### Unfair Advantages

| Advantage | Why It Matters |
|---|---|
| **Stack alignment** | Next.js, Supabase, Vercel, Stripe — production SaaS on the exact same stack. W4 was a C++/Godot company trying to do cloud. We're a cloud company that understands game devs. |
| **MCP expertise** | No one else in the Godot ecosystem understands MCP servers. An AI-powered build system you can talk to via Claude Desktop is years ahead. |
| **OpenConductor synergy** | Trust Stack attestation for game builds (prove binary matches source) maps directly to existing infrastructure. |
| **Solo speed** | W4 had committees. We ship. The Godot community values builders who show up and deliver. |
| **Community credibility** | Being open about AI-powered development resonates with a community that is fiercely pro-transparency and anti-corporate. |

### Long-Term Moat: The Platform Play

GodotForge starts as CI/CD but becomes the **developer platform**. Add analytics, crash reporting, A/B testing, feature flags, and live ops — all Godot-native. This is the Unity Cloud / PlayFab playbook applied to the fastest-growing open-source game engine.

**The CI/CD is the wedge. The platform is the business.**

---

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| **GitHub Actions is "good enough"** | Target the 80% who don't want to write YAML. Free tier captures experimenters, the UX converts them. |
| **W4 re-enters the market** | By the time they react, we have 6+ months of community trust, integrations, and user data. First-mover advantage in a community-driven ecosystem is massive. |
| **Godot growth stalls** | MIT license and momentum (doubled users, quadrupled games) suggest sustained growth. 5,300+ Steam games is already a serviceable market. |
| **Compute costs** | Spot/preemptible instances, Godot export template caching, free tier limited to 2 platforms. Margin improves at scale. |
| **Bandwidth across projects** | MVP uses existing stack. Contract work funds the runway. |

### What Could Go Very Right

If the Godot Asset Store launches with paid assets and integrates build/deploy tooling, GodotForge could become the **default CI/CD recommended by the Godot Foundation itself**. The Foundation is a nonprofit — they want commercial ecosystem partners. W4 was that partner. The chair is empty.

---

## Pricing Strategy

Free tier to capture hobbyists and game jam devs (the Godot community is deeply open-source-minded and price-sensitive). Paid tiers for anyone shipping commercially. Usage-based compute so you only pay for what you build. This mirrors Vercel's model — generous free, pay when you're serious.

| Tier | Price | Target |
|---|---|---|
| **Starter** | Free | Game jam devs, learners, hobby projects |
| **Indie** | $19/mo | Solo devs shipping real games |
| **Studio** | $49/mo | Small studios (up to 5 seats) |
| **Enterprise** | Custom | Studios, enterprise gamification |

### Revenue Projections

- **Year 1:** $5K–$10K MRR (250–500 Indie subscribers)
- **Year 2:** $25K–$50K MRR (Studio tier + Enterprise)
- **Year 3:** $100K+ MRR (marketplace effects, API integrations, AI features)

**Why this works:** W4 Build was enterprise-focused and likely priced out most indie devs. The Godot community is 90%+ indie. By leading with a generous free tier and $19/mo Indie plan, we capture the long tail W4 never served. As Godot games generate more revenue (Brotato: $10.7M, Buckshot Roulette: $6.9M), studios will happily pay $49+/mo.
