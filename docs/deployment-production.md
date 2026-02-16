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

## 3.2) Add GitHub Repository Secrets (PR label preview deploy)

In `Settings` -> `Secrets and variables` -> `Actions` -> `Repository secrets`, add:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

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
  - `ALLOWED_ORIGINS` (comma-separated, e.g. production + preview origins)
  - Optional auth hardening toggles:
    - `REQUIRE_ADMIN_MFA` (default: enabled in preview/production)
    - `AUTH_CAPTCHA_MODE` (`off` | `optional` | `required`; default: `optional` in preview/production)
  - Optional Speed Insights override:
    - `ENABLE_VERCEL_SPEED_INSIGHTS=false` (default is enabled in production)
- For `Preview`:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `ALLOWED_ORIGINS` (at least preview origin)
  - Optional auth hardening toggles:
    - `REQUIRE_ADMIN_MFA` (default: enabled in preview/production)
    - `AUTH_CAPTCHA_MODE` (`off` | `optional` | `required`; default: `optional` in preview/production)
  - Optional Speed Insights override:
    - `ENABLE_VERCEL_SPEED_INSIGHTS=false` (default is enabled in preview)

## 6) Configure Supabase Auth URLs

In Supabase -> Authentication -> URL Configuration:

- `Site URL` = your production app URL
- Add redirect URLs for:
  - production URL
  - preview URLs (if used)
  - localhost (optional for local testing)

## 6.1) Configure Supabase Auth Security Baseline

In Supabase -> Authentication, configure these for both preview and production:

- `Email`:
  - Use custom SMTP (not shared default SMTP) for deliverability and branding.
  - Customize email templates (confirm signup, reset password, change email).
  - Enable security-oriented notification emails where available.
- `Bot / abuse protection`:
  - Enable CAPTCHA provider in Supabase Auth.
  - Set app env `AUTH_CAPTCHA_MODE=required` after client token wiring is validated.
- `Password security`:
  - Keep strong password requirements enabled in Supabase.
  - App API additionally enforces minimum complexity on register/reset/password change/admin user management.
- `MFA`:
  - Enable TOTP MFA in Supabase Auth.
  - App API enforces MFA (`aal2`) for admin routes by default in preview/production.
  - Emergency rollback only: set `REQUIRE_ADMIN_MFA=false` temporarily.
- `Rate limits`:
  - Review and tune Supabase Auth rate limits in dashboard.
  - Keep app-level route rate limits enabled (already enforced in auth endpoints).

## 7) Configure Vercel Git behavior

In Vercel project -> Settings -> Git:

- Set **Production Branch** to `production`.
- Keep `main` as your preview branch.

Repository configuration (`vercel.json`) already restricts branch deploys:

- `production` -> production deployment
- `main` -> preview deployment
- all other branches -> no automatic Vercel deployment

## 8) Workflow behavior

- `CI` runs on all pushes and pull requests.
- `Deploy Production DB` runs only after successful `CI` on pushes to `production` (`workflow_run`).
- `Deploy Preview DB` runs only after successful `CI` on pushes to `main` (`workflow_run`).
- `Deploy PR Preview` runs on pull request updates only when the PR has label `preview-deploy`.
- `Deploy PR Preview` is skipped for fork PRs (no repository secrets exposure).
- `Deploy PR Preview` runs only for PRs targeting `main` and uses GitHub `pull_request_target` so the restricted `preview` environment can be used.
- `Deploy PR Preview` includes both preview DB deploy (`supabase db push --linked`) and Vercel preview deploy.
- DB deploy workflows run `supabase db lint --linked --schema public --fail-on warning` after migrations.
- DB deploy workflows also run `supabase inspect db outliers --linked` (non-blocking) for query visibility.

Deployment order:

1. Push to branch
2. Vercel deploys:
  - `production` branch -> production deployment
  - `main` branch -> preview deployment
  - all other branches -> skipped by Vercel unless PR is labeled `preview-deploy`
3. `CI` runs
4. On successful `CI`:
  - `production` branch -> `Deploy Production DB` runs `supabase db push --linked`
  - `main` branch -> `Deploy Preview DB` runs `supabase db push --linked`
5. If PR label `preview-deploy` is present, `Deploy PR Preview` creates a Vercel preview deployment and comments the URL on the PR.
6. DB workflow then runs admin bootstrap script:
  - creates admin user when missing
  - enforces `profiles.role = 'admin'` for that user
  - keeps existing admin account idempotently

For performance incident investigations, use:
- Vercel Speed Insights (web vitals and route metrics)
- Supabase Database tools (`Database Linter`, `Query Performance`, `inspect db outliers`)

## 9) Trigger deployment

1. Merge/push to `production`.
2. Vercel creates a production deployment automatically.
3. Wait for `CI` to pass.
4. `Deploy Production DB` starts automatically.

## 10) Rollback basics

- Vercel: redeploy previous successful deployment from dashboard.
- Supabase: create a new forward migration that reverts the problematic change.
- Never mutate old production migrations in place.
