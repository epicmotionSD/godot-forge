# ⚒ GodotForge

**Ship your Godot game. Not YAML.**

The managed CI/CD platform built exclusively for Godot Engine. Connect your repo, pick your platforms, deploy to Steam and itch.io. No Docker. No config files. No DevOps degree.

> W4 Build is dead. GodotForge is the replacement.

[![Waitlist](https://img.shields.io/badge/waitlist-open-blue)](https://godot-forge.vercel.app) [![Status](https://img.shields.io/badge/status-pre--beta-orange)]()

---

## Why GodotForge?

On December 20, 2025, W4 Games killed **W4 Build** — the only managed CI/CD platform for Godot Engine. The managed service is gone. Nobody has stepped in.

Every Godot developer now has two options:
1. Write 87 lines of YAML and debug Docker containers
2. Export manually from the editor, every time

**GodotForge is option 3.** A managed platform that speaks Godot natively.

## How It Works

```
1. Connect your GitHub/GitLab repo
2. GodotForge auto-detects your project.godot, export presets, and engine version
3. Toggle your target platforms in the dashboard (Windows, Linux, macOS, Web, Android)
4. Push code → builds run → artifacts deploy to Steam/itch.io
```

## Features

| Feature | Description |
|---|---|
| **Auto-Detect Everything** | Finds your `project.godot`, reads export presets, detects engine version |
| **Visual Build Matrix** | Toggle platforms from a dashboard — no config files, parallel builds |
| **Real-Time Build Logs** | Stream logs live. See clone → import → export → upload phases |
| **Deploy to Steam** | One-click SteamCMD integration. Configure app ID once, auto-deploy every build |
| **Deploy to itch.io** | Built-in Butler integration. API key + game slug → done |
| **Build on Push** | GitHub/GitLab webhooks. Push to main? Build. Create a tag? Release build |

## Pricing

| | Starter | Indie | Studio | Enterprise |
|---|---|---|---|---|
| **Price** | Free | $19/mo | $49/mo | Custom |
| **Projects** | 2 | 10 | Unlimited | Unlimited |
| **Build Minutes** | 100/mo | 500/mo | 2,000/mo | Unlimited |
| **Platforms** | 2 per build | All | All | All |
| **Deploy** | Artifacts only | Steam + itch.io | Steam + itch.io | All stores |
| **Retention** | 7 days | 30 days | 90 days | Custom |
| **Support** | Community | Priority | Email | SLA |

## Tech Stack

- **Frontend:** Next.js + TypeScript on Vercel
- **Backend:** Supabase (auth, database, real-time)
- **Build Runners:** Docker containers on Railway/Fly.io with pre-installed Godot export templates
- **Deployments:** SteamCMD, Butler (itch.io), S3-compatible storage
- **Billing:** Stripe (subscriptions + usage metering)
- **Build Queue:** Inngest

## Project Structure

```
godot-forge/
├── api/
│   └── waitlist.js         # Vercel serverless function
├── docs/
│   ├── ROADMAP.md          # Product roadmap with milestones
│   ├── VISION.md           # Product vision & strategy
│   ├── ARCHITECTURE.md     # Technical architecture
│   └── SPRINT.md           # Current sprint plan
├── index.html              # Landing page
├── package.json
├── vercel.json
└── supabase-setup.sql      # Database setup script
```

## Getting Started (Development)

```bash
# Clone the repo
git clone https://github.com/your-org/godot-forge.git
cd godot-forge

# Deploy to Vercel
vercel

# Set environment variables
vercel env add SUPABASE_URL production
vercel env add SUPABASE_SERVICE_ROLE_KEY production

# Redeploy
vercel --prod
```

## Waitlist

The beta waitlist is live at **[godot-forge.vercel.app](https://godot-forge.vercel.app)**

## License

Proprietary — Sonnier Ventures

---

*Built with Godot devs, for Godot devs. Not affiliated with the Godot Engine project or Godot Foundation.*
