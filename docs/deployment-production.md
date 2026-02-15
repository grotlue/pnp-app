# Production Deployment Setup (Vercel Auto Deploy + Supabase Migrations)

This guide configures:

- Vercel auto deploy via Git integration (production branch only for production releases)
- Supabase migrations via GitHub Actions after successful CI on `production`

## 1) Preconditions

- Supabase project exists (production).
- Vercel project exists (production).
- GitHub Actions enabled for the repository.

## 2) Configure GitHub Environment

1. Open repository `Settings`.
2. Go to `Environments`.
3. Create/select environment `production`.
4. Add protection rules:
   - Required reviewers (recommended).
   - Optional wait timer.

The deploy workflow already targets `environment: production`.

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

## 4) Where to find each value

### Supabase

- `SUPABASE_ACCESS_TOKEN`:
  - Supabase Dashboard -> Account -> Access Tokens
- `SUPABASE_PROJECT_REF`:
  - Supabase project -> Settings -> General -> Reference ID
- `SUPABASE_DB_PASSWORD`:
  - Supabase project -> Settings -> Database

## 5) Configure Vercel project env vars

In Vercel project -> Settings -> Environment Variables (Production), set:

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

Optional (if you want no preview deployments from other branches):

- Use an ignored build step condition for non-`production` branches.

## 8) Workflow behavior

- `CI` runs on pushes/PRs to `main` and `production`.
- `Deploy Production DB` runs only when:
  - CI finished successfully
  - event is a direct `push`
  - branch is `production`
  - workflow run originates from the same repository

Deployment order:

1. Push/merge to `production`
2. Vercel auto-deploys production from Git integration
3. CI runs
4. On successful CI, `Deploy Production DB` runs `supabase db push --linked`

## 9) Trigger deployment

1. Merge/push to `production`.
2. Vercel creates a production deployment automatically.
3. Wait for `CI` to pass.
4. `Deploy Production DB` starts automatically.

## 10) Rollback basics

- Vercel: redeploy previous successful deployment from dashboard.
- Supabase: create a new forward migration that reverts the problematic change.
- Never mutate old production migrations in place.
