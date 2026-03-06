import { useState } from "react";

const sections = [
  {
    id: "opportunity",
    label: "The Opportunity",
    icon: "🎯",
    content: {
      title: "W4 Build Is Dead. The Market Is Yours.",
      blocks: [
        {
          heading: "What Happened",
          text: "On December 20, 2025, W4 Games killed W4 Build — their cloud-based CI/CD platform purpose-built for Godot Engine. Users were given until January 2026 to migrate. The core tech was open-sourced under AGPL on GitLab, but the managed service is gone. No one has stepped in to fill the gap."
        },
        {
          heading: "What W4 Build Was",
          text: "A managed cloud CI that let Godot devs build custom engine compilations, export games to Windows/Linux/macOS/Android/iOS/Web, trigger builds via GitHub/GitLab webhooks, deploy artifacts to Steam/itch.io/S3, manage build matrices across platforms, and collaborate with team members. It was the only Godot-specific managed CI/CD service."
        },
        {
          heading: "What Exists Now (Not Much)",
          items: [
            { name: "godot-ci (abarichello)", desc: "Docker image + GitHub Actions templates. Free, DIY, no dashboard, no managed infra. 2.6K+ stars." },
            { name: "Codemagic", desc: "Generic mobile CI/CD that supports Godot as one of many engines. Not Godot-optimized." },
            { name: "Manual GitHub Actions / GitLab CI", desc: "Custom YAML configs. Error-prone, time-consuming, no UI." },
            { name: "W4 Build AGPL Source", desc: "Open-sourced but requires self-hosting. Most indie devs won't run their own CI infrastructure." }
          ]
        },
        {
          heading: "The Market Size",
          stats: [
            { value: "5,300+", label: "Godot games on Steam (and growing 69% YoY)" },
            { value: "2x", label: "User base doubled in a single month after Unity controversy" },
            { value: "394+", label: "New Godot Steam games by Aug 2025 (surpassed all of 2024)" },
            { value: "$0", label: "Revenue share Godot takes from your games (MIT license)" },
            { value: "0", label: "Managed Godot CI/CD services available right now" }
          ]
        }
      ]
    }
  },
  {
    id: "product",
    label: "Product Vision",
    icon: "🔧",
    content: {
      title: "GodotForge — Ship Games, Not YAML",
      blocks: [
        {
          heading: "One-Liner",
          text: "GodotForge is the managed CI/CD platform built exclusively for Godot developers — connect your repo, pick your platforms, and ship. No Docker configs. No YAML wrestling. No DevOps degree required."
        },
        {
          heading: "Core Value Proposition",
          text: "Game developers want to make games, not manage build infrastructure. Every hour spent debugging a GitHub Actions workflow is an hour not spent on gameplay. GodotForge eliminates that friction entirely — it speaks Godot natively, understands export presets, handles platform-specific signing, and deploys directly to the stores where players buy games."
        },
        {
          heading: "MVP Feature Set (Launch in 8-10 weeks)",
          items: [
            { name: "One-Click Repo Connect", desc: "GitHub and GitLab OAuth. Auto-detect Godot project structure, engine version, and export presets." },
            { name: "Visual Build Matrix", desc: "Toggle platforms (Windows, Linux, macOS, Web, Android) with a UI — no config files. Each platform shows estimated build time." },
            { name: "Managed Build Runners", desc: "Pre-configured cloud containers with Godot export templates pre-installed. Support Godot 4.x (GDScript and C#)." },
            { name: "Auto-Deploy Pipeline", desc: "Built-in deployment to Steam (via SteamCMD), itch.io (via Butler), and downloadable artifacts. One toggle per store." },
            { name: "Build Dashboard", desc: "Real-time build logs, history, artifact downloads, build status badges for your repo README." },
            { name: "Webhook Triggers", desc: "Auto-build on push, PR, or tag. Manual trigger button in dashboard." }
          ]
        },
        {
          heading: "V2 Features (Months 3-6)",
          items: [
            { name: "Custom Engine Builds", desc: "Compile Godot from source with custom modules, optimization flags, stripped features for smaller binaries." },
            { name: "Build Size Optimizer", desc: "AI-powered analysis of your project to recommend which engine modules to strip for 30-50% smaller exports." },
            { name: "Team Collaboration", desc: "Invite team members, role-based access, shared build configs, audit logs." },
            { name: "iOS Export", desc: "Managed macOS build runners for iOS exports with certificate management." },
            { name: "Automated Testing", desc: "Run GUT (Godot Unit Testing) or custom test suites before export. Fail builds on test failures." },
            { name: "Analytics Dashboard", desc: "Build time trends, export size tracking, platform coverage metrics." }
          ]
        },
        {
          heading: "V3 Features — The OpenConductor Play (Months 6-12)",
          items: [
            { name: "AI Build Assistant", desc: "Natural language build config: 'Build for Steam and itch.io on every push to main, skip web builds on PRs.' Powered by Claude API + GDScript-aware context." },
            { name: "MCP Server Integration", desc: "Expose GodotForge as an MCP server. Let Claude Desktop or other AI agents trigger builds, check status, download artifacts via natural language." },
            { name: "Trust Stack Integration", desc: "On-chain build attestation via OpenConductor. Prove your game binary matches your source code. Agent identity for automated builds." },
            { name: "Marketplace Deployment", desc: "Deploy to Epic Games Store, GOG, Google Play, and web portals (Poki, CrazyGames) — not just Steam/itch.io." },
            { name: "GodotForge CLI", desc: "npm package for triggering builds from terminal. Integrates with existing dev workflows and scripts." }
          ]
        }
      ]
    }
  },
  {
    id: "tech",
    label: "Tech Stack",
    icon: "⚡",
    content: {
      title: "Built on What You Already Know",
      blocks: [
        {
          heading: "Frontend",
          items: [
            { name: "Next.js + TypeScript", desc: "Your primary stack. Dashboard, onboarding, build config UI." },
            { name: "Vercel", desc: "Hosting and edge functions for the web app." },
            { name: "Supabase", desc: "Auth, database (build history, user projects, team management), real-time subscriptions for live build logs." }
          ]
        },
        {
          heading: "Build Infrastructure",
          items: [
            { name: "Docker Containers", desc: "Pre-built Godot export containers based on the godot-ci Docker images. Maintained for each Godot 4.x version." },
            { name: "Railway or Fly.io", desc: "Managed container orchestration for build runners. Pay-per-use compute. Railway for v1, migrate to dedicated infra at scale." },
            { name: "GitHub/GitLab Apps", desc: "OAuth apps for repo access. Listen to webhook events for auto-triggers." },
            { name: "Godot Headless", desc: "Run `godot --headless --export-release` in containers. Parse export_presets.cfg to auto-detect configured platforms." }
          ]
        },
        {
          heading: "Deployment Integrations",
          items: [
            { name: "SteamCMD", desc: "Valve's CLI for uploading builds to Steam. Requires user's Steam credentials (encrypted at rest)." },
            { name: "Butler (itch.io)", desc: "itch.io's official upload tool. Simple API key auth." },
            { name: "S3-Compatible Storage", desc: "For artifact storage and custom deployment targets." },
            { name: "Stripe", desc: "Billing, subscriptions, usage-based metering." }
          ]
        },
        {
          heading: "Key Architecture Decisions",
          text: "Use the AGPL-licensed W4 Build source as a reference (NOT as a base — AGPL would require open-sourcing your SaaS). Instead, build clean-room from your Next.js stack. The heavy lifting is container orchestration and Godot CLI automation, not novel technology. Leverage Inngest for build queue management (you've already used it for KeLatic campaigns). Supabase Realtime for streaming build logs to the dashboard."
        }
      ]
    }
  },
  {
    id: "pricing",
    label: "Pricing",
    icon: "💰",
    content: {
      title: "Pricing That Captures the Full Market",
      blocks: [
        {
          heading: "Strategy",
          text: "Free tier to capture hobbyists and game jam devs (the Godot community is deeply open-source-minded and price-sensitive). Paid tiers for anyone shipping commercially. Usage-based compute so you only pay for what you build. This mirrors Vercel's model — generous free, pay when you're serious."
        },
        {
          heading: "Tier Breakdown",
          items: [
            { name: "🆓 Starter (Free)", desc: "2 projects, 100 build minutes/month, 2 platforms per build, community support, 7-day artifact retention. Target: game jam devs, learners, hobby projects." },
            { name: "🚀 Indie ($19/mo)", desc: "10 projects, 500 build minutes/month, all platforms, Steam + itch.io deploy, 30-day artifact retention, priority builds. Target: solo devs shipping real games." },
            { name: "🏢 Studio ($49/mo)", desc: "Unlimited projects, 2,000 build minutes/month, team seats (up to 5), custom engine builds, automated testing, 90-day artifacts, email support. Target: small studios." },
            { name: "🏗️ Enterprise (Custom)", desc: "Unlimited everything, dedicated build runners, SLA, SSO, audit logs, on-prem option, Trust Stack attestation. Target: studios, enterprise gamification." }
          ]
        },
        {
          heading: "Revenue Projections",
          stats: [
            { value: "Year 1 Target", label: "$5K-$10K MRR (250-500 Indie subscribers)" },
            { value: "Year 2 Target", label: "$25K-$50K MRR (adding Studio tier + Enterprise)" },
            { value: "Year 3 Target", label: "$100K+ MRR (marketplace effects, API integrations, AI features)" }
          ]
        },
        {
          heading: "Why This Works",
          text: "W4 Build was enterprise-focused and likely priced out most indie devs. The Godot community is 90%+ indie. By leading with a generous free tier and $19/mo Indie plan, you capture the long tail that W4 never served. As Godot games generate more revenue (Brotato: $10.7M, Buckshot Roulette: $6.9M), studios will happily pay $49+/mo for reliable build infrastructure."
        }
      ]
    }
  },
  {
    id: "gtm",
    label: "Go-to-Market",
    icon: "🚀",
    content: {
      title: "Launch Strategy: Community-First, Speed-Wins",
      blocks: [
        {
          heading: "Phase 1: Build in Public (Weeks 1-4)",
          items: [
            { name: "Announce on r/godot", desc: "Post: 'W4 Build is dead — I'm building the replacement. Here's my plan.' Share the product vision, ask for feedback. The Godot subreddit is 300K+ members." },
            { name: "Godot Forum Post", desc: "Detailed technical breakdown on forum.godotengine.org. Engage with the existing thread about W4 Build shutdown." },
            { name: "Twitter/X Threads", desc: "Weekly build-in-public updates. Tag @W4Games, @godaborinos (Juan Linietsky), @redaborines. Show real progress." },
            { name: "Discord Presence", desc: "Join the official Godot Discord (100K+ members) and game dev Discords. Offer to help people with CI/CD while building." }
          ]
        },
        {
          heading: "Phase 2: Beta Launch (Weeks 5-8)",
          items: [
            { name: "Closed Beta", desc: "Invite 50-100 devs from the Reddit/forum engagement. Give them free Indie tier for 6 months in exchange for feedback + testimonials." },
            { name: "Integration Partners", desc: "Reach out to Godot YouTube creators (Brackeys, GDQuest, HeartBeast) for coverage. Offer free Studio tier." },
            { name: "GitHub Action Wrapper", desc: "Release a free GitHub Action that wraps GodotForge API — captures devs already using godot-ci who want something better." }
          ]
        },
        {
          heading: "Phase 3: Public Launch (Weeks 9-12)",
          items: [
            { name: "Hacker News Launch", desc: "You already have a HN strategy from the OpenConductor SDK. Apply it here: 'Show HN: GodotForge — Managed CI/CD for the fastest-growing game engine'" },
            { name: "Product Hunt", desc: "Launch with a compelling demo video showing a Godot project going from git push to playable Steam build in under 5 minutes." },
            { name: "Godot Asset Library", desc: "Publish a free GodotForge plugin that adds a 'Deploy' button directly in the Godot editor." },
            { name: "Content Marketing", desc: "Blog posts: 'How to Ship Your Godot Game to Steam in 5 Minutes', 'Why Game Devs Shouldn't Write YAML', 'The State of Godot CI/CD in 2026'" }
          ]
        },
        {
          heading: "Phase 4: Ecosystem Lock-in (Months 4-12)",
          items: [
            { name: "Godot Editor Plugin", desc: "In-editor build status, one-click deploy, build history — without leaving Godot. This is the moat." },
            { name: "Game Jam Sponsorships", desc: "Sponsor Ludum Dare, GMTK Game Jam, Godot Wild Jam with free build minutes. Capture devs at the moment they start a project." },
            { name: "GodotCon Presence", desc: "Sponsor and speak at GodotCon. W4 was the dominant presence — now there's a void." },
            { name: "Partnership Pipeline", desc: "Integrate with Poki, CrazyGames for one-click web deployment. Partner with Nakama/PlayFab for backend deploys alongside game deploys." }
          ]
        }
      ]
    }
  },
  {
    id: "moat",
    label: "Competitive Moat",
    icon: "🏰",
    content: {
      title: "Why No One Else Will Build This (But You Will)",
      blocks: [
        {
          heading: "Why W4 Failed at This",
          text: "W4 Games is a 20-person company that raised $23.5M. They spread across console ports (W4 Consoles), CI/CD (W4 Build), cloud multiplayer (W4 Cloud), XR toolkits, and enterprise services. They couldn't focus. CI/CD was their least defensible product — it's infrastructure, not IP. They killed it to focus on consoles and enterprise, where margins are higher. But that means they validated the need and left the market."
        },
        {
          heading: "Your Unfair Advantages",
          items: [
            { name: "Stack Alignment", desc: "Next.js, Supabase, Vercel, Stripe — you've built production SaaS on this exact stack. W4 was a C++/Godot company trying to do cloud. You're a cloud company that understands game devs." },
            { name: "MCP Expertise", desc: "No one else in the Godot ecosystem understands MCP servers. An AI-powered build system that you can talk to via Claude Desktop is years ahead of anything the community is building." },
            { name: "OpenConductor Synergy", desc: "Trust Stack attestation for game builds (prove your binary matches your source) is a unique differentiator that maps directly to your existing infrastructure." },
            { name: "Solo Speed", desc: "W4 had committees. You ship. The Godot community values builders who show up and deliver. Your CLI already has 1,000+ weekly npm downloads — you know how to get traction." },
            { name: "Community Credibility", desc: "Being open about AI-powered development (your Anthropic App Store observation) resonates with the Godot community, which is fiercely pro-transparency and anti-corporate." }
          ]
        },
        {
          heading: "Long-Term Moat: The Platform Play",
          text: "GodotForge starts as CI/CD but becomes the developer platform. Add analytics, crash reporting, A/B testing, feature flags, and live ops — all Godot-native. This is the Unity Cloud / PlayFab playbook applied to the fastest-growing open-source game engine. The CI/CD is the wedge. The platform is the business."
        }
      ]
    }
  },
  {
    id: "risks",
    label: "Risks & Mitigations",
    icon: "⚠️",
    content: {
      title: "Eyes Wide Open",
      blocks: [
        {
          heading: "Key Risks",
          items: [
            { name: "GitHub Actions Is 'Good Enough'", desc: "Risk: Devs cobble together free CI with godot-ci Docker images. Mitigation: Target the 80% who don't want to write YAML. The free tier captures experimenters, the UX converts them." },
            { name: "W4 Re-enters the Market", desc: "Risk: W4 pivots back or launches a new build service. Mitigation: By the time they react, you have 6+ months of community trust, integrations, and user data. First-mover advantage in a community-driven ecosystem is massive." },
            { name: "Godot Growth Stalls", desc: "Risk: Godot plateaus or a new engine emerges. Mitigation: Godot's MIT license and momentum (doubled users, quadrupled games) suggest sustained growth. Even at current size, 5,300+ Steam games is a serviceable market." },
            { name: "Compute Costs", desc: "Risk: Build minutes are expensive, free tier bleeds money. Mitigation: Use spot/preemptible instances, cache Godot export templates aggressively, limit free tier to 2 platforms. Margin improves dramatically at scale." },
            { name: "Bandwidth Across Projects", desc: "Risk: You're already running OpenConductor, x3o.ai, KeLatic, and contract work. Mitigation: GodotForge MVP is a focused product that uses your existing stack. Dogfood by building a Godot game yourself. The contract work funds the runway." }
          ]
        },
        {
          heading: "What Could Go Very Right",
          text: "If the Godot Asset Store launches with paid assets and integrates build/deploy tooling, GodotForge could become the default CI/CD recommended by the Godot Foundation itself. The Foundation is a nonprofit — they want commercial ecosystem partners. W4 was that partner. The chair is empty."
        }
      ]
    }
  }
];

export default function GodotForgeStrategy() {
  const [activeSection, setActiveSection] = useState("opportunity");
  const current = sections.find(s => s.id === activeSection);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0f",
      color: "#e8e6e3",
      fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
    }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
        borderBottom: "2px solid #478ac9",
        padding: "24px 32px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 8 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 8,
            background: "linear-gradient(135deg, #478ac9, #e94560)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22, fontWeight: 900, color: "#fff",
          }}>⚒</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: "-0.5px",
              background: "linear-gradient(90deg, #478ac9, #e94560)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>GodotForge</h1>
            <p style={{ margin: 0, fontSize: 13, color: "#8892b0", letterSpacing: 1 }}>
              PRODUCT STRATEGY — SONNIER VENTURES
            </p>
          </div>
        </div>
        <p style={{ margin: 0, fontSize: 15, color: "#a8b2d1", maxWidth: 680, lineHeight: 1.5 }}>
          The managed CI/CD platform built exclusively for Godot Engine. W4 Build is dead. The market is wide open. Here's the plan.
        </p>
      </div>

      {/* Navigation */}
      <div style={{
        display: "flex", flexWrap: "wrap", gap: 4, padding: "12px 32px",
        background: "#0d0d14", borderBottom: "1px solid #1e2a3a",
      }}>
        {sections.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            style={{
              padding: "8px 16px", border: "none", borderRadius: 6, cursor: "pointer",
              fontSize: 13, fontFamily: "inherit", fontWeight: 600,
              background: activeSection === s.id
                ? "linear-gradient(135deg, #478ac9, #3a6fa8)"
                : "transparent",
              color: activeSection === s.id ? "#fff" : "#6b7a94",
              transition: "all 0.2s",
            }}
          >
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: "32px", maxWidth: 900, margin: "0 auto" }}>
        <h2 style={{
          fontSize: 28, fontWeight: 800, margin: "0 0 32px 0",
          background: "linear-gradient(90deg, #e8e6e3, #a8b2d1)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>
          {current.content.title}
        </h2>

        {current.content.blocks.map((block, i) => (
          <div key={i} style={{
            marginBottom: 32, padding: 24,
            background: "linear-gradient(135deg, #12121a, #151520)",
            borderRadius: 12, border: "1px solid #1e2a3a",
          }}>
            <h3 style={{
              fontSize: 16, fontWeight: 700, margin: "0 0 16px 0",
              color: "#478ac9", letterSpacing: 0.5,
            }}>
              {block.heading}
            </h3>

            {block.text && (
              <p style={{
                margin: 0, fontSize: 14, lineHeight: 1.7, color: "#c4c4c4",
              }}>
                {block.text}
              </p>
            )}

            {block.items && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {block.items.map((item, j) => (
                  <div key={j} style={{
                    padding: "12px 16px", borderRadius: 8,
                    background: "rgba(71, 138, 201, 0.06)",
                    borderLeft: "3px solid #478ac9",
                  }}>
                    <span style={{ fontWeight: 700, color: "#e94560", fontSize: 13 }}>
                      {item.name}
                    </span>
                    <span style={{ color: "#555", margin: "0 8px" }}>—</span>
                    <span style={{ color: "#a8b2d1", fontSize: 13, lineHeight: 1.6 }}>
                      {item.desc}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {block.stats && (
              <div style={{
                display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: 16, marginTop: 8,
              }}>
                {block.stats.map((stat, j) => (
                  <div key={j} style={{
                    textAlign: "center", padding: 16, borderRadius: 8,
                    background: "rgba(233, 69, 96, 0.08)",
                    border: "1px solid rgba(233, 69, 96, 0.15)",
                  }}>
                    <div style={{
                      fontSize: 28, fontWeight: 900, color: "#e94560",
                      marginBottom: 4,
                    }}>
                      {stat.value}
                    </div>
                    <div style={{ fontSize: 11, color: "#8892b0", lineHeight: 1.3 }}>
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        padding: "24px 32px", borderTop: "1px solid #1e2a3a",
        textAlign: "center", color: "#4a5568", fontSize: 12,
      }}>
        GodotForge Strategy Doc — Sonnier Ventures — March 2026
      </div>
    </div>
  );
}