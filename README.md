# pnp-app

Next.js App Router + TypeScript + Tailwind + shadcn/ui + Supabase.

## Status (Phase 1 MVP)

Implemented:

- Auth (Register, Login, Password Reset, Email Verification)
- User-Profile & Settings
- Campaigns + Memberships (Invite/Request/Decision)
- Characters (PC/NPC) with campaign assignment
- Relationships + Timeline + Notifications
- Localization (`en`, `de`)
- Supabase RLS + server-side permission checks via API routes

## Architecture

See `docs/app-architecture.md` for the current architecture and conventions.

## Prerequisites

- Node.js
- Yarn
- Docker Desktop (for local Supabase stack)

## Local setup

```bash
cp .env.example .env.local
yarn supabase:start
yarn supabase:env:local
yarn dev
```

Useful commands:

```bash
yarn supabase:status
yarn supabase:stop
yarn supabase:db:reset
```

## Migrations & DB

Create a new migration:

```bash
yarn supabase:db:new <name>
```

Test locally with all migrations:

```bash
yarn supabase:db:reset
```

## Quality checks

```bash
yarn typecheck
yarn lint
yarn test:run
yarn build
```

## Automatic deployment (`production` branch)

Current mode:

- **Vercel Git integration** deploys the app automatically.
- **GitHub Actions** deploys Supabase migrations:
  - to `production` after CI succeeds on `production` pushes
  - to `preview` after CI succeeds on non-`production` pushes

Workflows:

- `CI` runs on all pushes and pull requests.
- `Deploy Production DB` runs only after successful CI on pushes to `production`.
- `Deploy Preview DB` runs only after successful CI on pushes to non-`production` branches.

Required GitHub secrets (Environment `production`):

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PROJECT_REF`
- `SUPABASE_DB_PASSWORD`

Required GitHub secrets (Environment `preview`):

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PROJECT_REF`
- `SUPABASE_DB_PASSWORD`

Step-by-step setup:

- `docs/deployment-production.md`

## Important paths

- API routes: `src/app/api/`
- Feature modules: `src/features/`
- Shared UI: `src/components/`
- Server helpers: `src/server/`
- I18n: `src/lib/i18n/`
- Supabase migrations: `supabase/migrations/`
- Local fixture logins: `docs/development/LOCAL_DEV_FIXTURE_USERS.md`
