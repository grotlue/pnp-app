# pnp-app

Next.js App Router + TypeScript + Tailwind + shadcn/ui + Supabase.

## Status (Phase 1 MVP)

Implemented:

- Auth (Register, Login, Password Reset, Email Verification)
- User-Profile & Settings
- Campaigns + Memberships (Invite/Request/Decision)
- Characters (PC/NPC) with campaign assignment
- Relationships + Timeline + Notifications
- Admin dashboard (users, campaigns, characters management)
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

## Branch and PR workflow

- Do not implement changes directly on `main` or `production`.
- Create a dedicated working branch per coherent change package.
- Always create new working branches from the latest `main`.
- Open a PR after the package is complete.
- See: `docs/development/BRANCHING_AND_PR_WORKFLOW.md`

## Automatic deployment (`production` branch)

Current mode:

- **Vercel Git integration** deploys the app automatically.
  - `production` branch -> production deployment
  - `main` branch -> preview deployment
  - all other branches -> no automatic Vercel deployment (`vercel.json`)
- **GitHub Actions** deploys Supabase migrations:
  - to `production` after CI succeeds on `production` pushes
  - to `preview` after CI succeeds on `main` pushes
  - PR preview deployments for non-main branches only when PR has label `preview-deploy`

Workflows:

- `CI` runs on all pushes and pull requests.
- `Deploy Production DB` runs only after successful CI on pushes to `production`.
- `Deploy Preview DB` runs only after successful CI on pushes to `main`.
- `Deploy PR Preview` runs on pull request updates only when label `preview-deploy` is present, only for PRs targeting `main`, and includes preview DB deploy plus Vercel preview deploy.

Required GitHub secrets (Environment `production`):

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PROJECT_REF`
- `SUPABASE_DB_PASSWORD`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_BOOTSTRAP_EMAIL`
- `ADMIN_BOOTSTRAP_PASSWORD`

Required GitHub secrets (Environment `preview`):

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PROJECT_REF`
- `SUPABASE_DB_PASSWORD`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_BOOTSTRAP_EMAIL`
- `ADMIN_BOOTSTRAP_PASSWORD`

Optional GitHub environment variables (`production`, `preview`):

- `NEXT_PUBLIC_SUPABASE_URL` (if omitted, derived from `SUPABASE_PROJECT_REF`)
- `ADMIN_BOOTSTRAP_USERNAME` (default: `admin`)
- `ADMIN_BOOTSTRAP_DESCRIPTION` (default: `System admin account`)
- `ADMIN_BOOTSTRAP_LOCALE` (default: `en`)

Required GitHub repository secrets for label-gated PR preview deployment:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

Required Vercel environment variable (server-only):

- `SUPABASE_SERVICE_ROLE_KEY`

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
- Admin credential template: `docs/development/ADMIN_BOOTSTRAP_CREDENTIALS_TEMPLATE.md`
- Branch + PR workflow: `docs/development/BRANCHING_AND_PR_WORKFLOW.md`

## Feature flags

- Central feature flag registry: `src/lib/features/feature-flags.ts`
- Default behavior:
  - `selfRegistration` is disabled in `production`
- Provider model:
  - `rules` (default fallback, no external provider required)
  - `vercel` (uses `flags-sdk.dev` with `@flags-sdk/vercel`)
- Optional overrides:
  - `APP_ENV=development|preview|production`
  - `FEATURE_FLAGS_PROVIDER=rules|vercel`
  - `FLAGS=<vercel-flags-connection-string>`
  - `FLAGS_SECRET=<32-byte-base64url-secret>` (required for Flags Explorer / encrypted toolbar overrides)
  - `NEXT_PUBLIC_ENABLE_VERCEL_TOOLBAR=true|false` (optional manual toggle outside development)
  - `FEATURE_FLAGS_ENABLE=<comma-separated-flags>`
  - `FEATURE_FLAGS_DISABLE=<comma-separated-flags>`
- Flags discovery endpoint (for Vercel Toolbar / Flags Explorer):
  - `src/app/.well-known/vercel/flags/route.ts`

### Local Flags UI (Toolbar + Flags Explorer)

1. Run `vc link` once in the repository to connect to your Vercel project.
2. Set `FLAGS_SECRET` in `.env.local`.
3. Start dev server with `yarn dev` (toolbar is auto-enabled in development).
4. Open app, authenticate in Vercel Toolbar, and use Flags Explorer.

If you want live values from Vercel Flags locally, also set:

- `FEATURE_FLAGS_PROVIDER=vercel`
- `FLAGS=<vercel-flags-connection-string>`
