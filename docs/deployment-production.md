# Deployment Setup (Vercel Auto Deploy + Supabase Migrations)

This guide configures:

- Vercel auto deploy via Git integration (production branch only for production releases)
- Supabase migrations via GitHub Actions:
  - production DB after successful CI on `production` pushes
  - preview DB after successful CI on `main` pushes
- Admin bootstrap user creation on both environments (idempotent)

## 1) Preconditions

- Supabase project exists (production).
- Vercel project exists (production).
- GitHub Actions enabled for the repository.

## 2) Configure GitHub Environments

1. Open repository `Settings`.
2. Go to `Environments`.
3. Create/select environment `production`.
4. Create/select environment `preview`.
5. Add protection rules:
   - Required reviewers (recommended).
   - Optional wait timer.

Deploy workflows target:

- `Deploy Production DB` -> `environment: production`
- `Deploy Preview DB` -> `environment: preview`

## 2.1) Protect `production` branch (recommended)

In GitHub repository -> Settings -> Branches -> Branch protection rules:

- Add rule for `production`
- Require pull request before merging
- Require status checks to pass before merging (select `CI / quality`)
- Restrict who can push (optional, recommended)

This is the safest way to ensure only CI-validated changes reach `production`.

## 3) Add GitHub Secrets (Environment: `production`)

In `Settings` -> `Environments` -> `production` -> `Environment secrets`, add:

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PROJECT_REF`
- `SUPABASE_DB_PASSWORD`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_BOOTSTRAP_EMAIL`
- `ADMIN_BOOTSTRAP_PASSWORD`

## 3.1) Add GitHub Secrets (Environment: `preview`)

In `Settings` -> `Environments` -> `preview` -> `Environment secrets`, add:

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PROJECT_REF`
- `SUPABASE_DB_PASSWORD`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_BOOTSTRAP_EMAIL`
- `ADMIN_BOOTSTRAP_PASSWORD`

Optional environment variables in both environments:

- `NEXT_PUBLIC_SUPABASE_URL` (if omitted, the workflow derives URL from `SUPABASE_PROJECT_REF`)
- `ADMIN_BOOTSTRAP_USERNAME` (default: `admin`)
- `ADMIN_BOOTSTRAP_DESCRIPTION` (default: `System admin account`)
- `ADMIN_BOOTSTRAP_LOCALE` (default: `en`)

## 4) Where to find each value

### Supabase

- `SUPABASE_ACCESS_TOKEN`:
  - Supabase Dashboard -> Account -> Access Tokens
- `SUPABASE_PROJECT_REF`:
  - Supabase project -> Settings -> General -> Reference ID
- `SUPABASE_DB_PASSWORD`:
  - Supabase project -> Settings -> Database
- `SUPABASE_SERVICE_ROLE_KEY`:
  - Supabase project -> Settings -> API -> service role key
- `ADMIN_BOOTSTRAP_EMAIL` / `ADMIN_BOOTSTRAP_PASSWORD`:
  - You define these values.
  - Store them in a password manager, not in the repository.

Use production Supabase values in GitHub environment `production`, and preview Supabase values in GitHub environment `preview`.

## 5) Configure Vercel project env vars

In Vercel project -> Settings -> Environment Variables:

- For `Production`:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
- For `Preview`:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`

## 6) Configure Supabase Auth URLs

In Supabase -> Authentication -> URL Configuration:

- `Site URL` = your production app URL
- Add redirect URLs for:
  - production URL
  - preview URLs (if used)
  - localhost (optional for local testing)

## 7) Configure Vercel Git behavior

In Vercel project -> Settings -> Git:

- Set **Production Branch** to `production`.
- Keep `main` as your preview branch.

Repository configuration (`vercel.json`) already restricts branch deploys:

- `production` -> production deployment
- `main` -> preview deployment
- all other branches -> no Vercel deployment

## 8) Workflow behavior

- `CI` runs on all pushes and pull requests.
- Deployment jobs are triggered from `CI` (reusable workflows), not via `workflow_run`.
- `deploy_production` runs only when:
  - `quality` in `CI` succeeded
  - event is `push`
  - branch is `production`
- `deploy_preview` runs only when:
  - `quality` in `CI` succeeded
  - event is `push`
  - branch is `main`

Deployment order:

1. Push to branch
2. Vercel deploys:
  - `production` branch -> production deployment
  - `main` branch -> preview deployment
  - all other branches -> skipped by Vercel
3. `CI` runs
4. On successful `quality` job:
  - `production` branch -> `Deploy Production DB` runs `supabase db push --linked`
  - `main` branch -> `Deploy Preview DB` runs `supabase db push --linked`
5. Workflow then runs admin bootstrap script:
  - creates admin user when missing
  - enforces `profiles.role = 'admin'` for that user
  - keeps existing admin account idempotently

## 9) Trigger deployment

1. Merge/push to `production`.
2. Vercel creates a production deployment automatically.
3. Wait for `CI` to pass.
4. `Deploy Production DB` starts automatically.

## 10) Rollback basics

- Vercel: redeploy previous successful deployment from dashboard.
- Supabase: create a new forward migration that reverts the problematic change.
- Never mutate old production migrations in place.
