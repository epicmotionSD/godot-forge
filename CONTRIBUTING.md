# Contributing to GodotForge

> Sonnier Ventures · Internal Development Guide

---

## Development Setup

### Prerequisites

- Node.js 18+
- npm or pnpm
- Vercel CLI (`npm i -g vercel`)
- A Supabase project
- Git

### Local Development

```bash
# Clone the repo
git clone <repo-url>
cd godot-forge

# Install dependencies
npm install

# Link to Vercel project
vercel link

# Pull environment variables locally
vercel env pull .env.local

# Start development server
npm run dev
```

### Environment Variables

| Variable | Description |
|---|---|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (client-side) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (client-side) |
| `STRIPE_SECRET_KEY` | Stripe API key |
| `GITHUB_APP_ID` | GitHub App ID |
| `GITHUB_APP_SECRET` | GitHub App secret |

---

## Project Structure

```
godot-forge/
├── api/                    # Vercel serverless functions
├── app/                    # Next.js app router (when MVP starts)
│   ├── (auth)/            # Auth pages (login, callback)
│   ├── (dashboard)/       # Authenticated dashboard
│   │   ├── projects/      # Project list and detail
│   │   ├── builds/        # Build history and logs
│   │   └── settings/      # User and billing settings
│   ├── layout.tsx
│   └── page.tsx
├── components/             # Shared UI components
├── lib/                    # Utilities (supabase client, stripe, etc.)
├── docker/                 # Godot build runner Dockerfiles
├── docs/                   # Project documentation
│   ├── ROADMAP.md
│   ├── VISION.md
│   ├── ARCHITECTURE.md
│   └── SPRINT.md
├── index.html              # Landing page (pre-MVP)
├── package.json
├── vercel.json
└── supabase-setup.sql
```

---

## Branch Strategy

| Branch | Purpose |
|---|---|
| `main` | Production — deployed to godot-forge.vercel.app |
| `develop` | Integration branch for feature work |
| `feature/*` | Individual feature branches |
| `fix/*` | Bug fix branches |

### Workflow

1. Create a branch from `develop`: `feature/build-system`
2. Make changes, commit with descriptive messages
3. Push and create a PR against `develop`
4. Merge to `develop` → Vercel preview deployment
5. Merge `develop` to `main` → production deployment

---

## Commit Convention

Use conventional commits:

```
feat: add build matrix UI
fix: handle duplicate email in waitlist
docs: update roadmap with Phase 2 milestones
chore: update Dockerfile for Godot 4.4
refactor: extract build queue logic to lib/
```

---

## Code Standards

- **TypeScript** with strict mode
- **ESLint + Prettier** for formatting
- **Tailwind CSS** for styling
- Server components by default, client components only when needed
- All API routes validate input and handle errors
- Credentials never logged or exposed to client
- RLS policies on every Supabase table
