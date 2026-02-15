# Deployment Setup (Vercel Auto Deploy + Supabase Migrations)

This guide configures:

- Vercel auto deploy via Git integration (production branch only for production releases)
- Supabase migrations via GitHub Actions:
  - production DB after successful CI on `production` pushes
  - preview DB after successful CI on non-`production` pushes

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

## 3.1) Add GitHub Secrets (Environment: `preview`)

In `Settings` -> `Environments` -> `preview` -> `Environment secrets`, add:

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PROJECT_REF`
- `SUPABASE_DB_PASSWORD`

## 4) Where to find each value

### Supabase

- `SUPABASE_ACCESS_TOKEN`:
  - Supabase Dashboard -> Account -> Access Tokens
- `SUPABASE_PROJECT_REF`:
  - Supabase project -> Settings -> General -> Reference ID
- `SUPABASE_DB_PASSWORD`:
  - Supabase project -> Settings -> Database

Use production Supabase values in GitHub environment `production`, and preview Supabase values in GitHub environment `preview`.

## 5) Configure Vercel project env vars

In Vercel project -> Settings -> Environment Variables:

- For `Production`:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- For `Preview`:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

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
- `Deploy Production DB` runs only when:
  - CI finished successfully
  - event is a direct `push`
  - branch is `production`
  - workflow run originates from the same repository
- `Deploy Preview DB` runs only when:
  - CI finished successfully
  - event is a direct `push`
  - branch is not `production`
  - workflow run originates from the same repository

Deployment order:

1. Push to branch
2. Vercel deploys:
  - `production` branch -> production deployment
  - `main` branch -> preview deployment
  - all other branches -> skipped by Vercel
3. CI runs
4. On successful CI:
  - `production` branch -> `Deploy Production DB` runs `supabase db push --linked`
  - non-`production` branch -> `Deploy Preview DB` runs `supabase db push --linked`

## 9) Trigger deployment

1. Merge/push to `production`.
2. Vercel creates a production deployment automatically.
3. Wait for `CI` to pass.
4. `Deploy Production DB` starts automatically.

## 10) Rollback basics

- Vercel: redeploy previous successful deployment from dashboard.
- Supabase: create a new forward migration that reverts the problematic change.
- Never mutate old production migrations in place.
