# Deployment (Preview + Production)

This project deploys app runtime via Vercel and database changes via GitHub Actions + Supabase CLI.

## Deployment Model

- Vercel Git integration:
  - `production` branch -> production deployment
  - `main` branch -> preview deployment
- GitHub Actions:
  - `deploy-production.yml` applies DB migrations for `production`
  - `deploy-preview.yml` resets/rebuilds preview DB for `main`
  - `deploy-pr-preview.yml` runs on labeled PRs (`preview-deploy`)

## Required GitHub Secrets

Environment `production` and `preview`:

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PROJECT_REF`
- `SUPABASE_DB_PASSWORD`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_BOOTSTRAP_EMAIL`
- `ADMIN_BOOTSTRAP_PASSWORD`

Repository secrets (PR preview deploy):

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

## Required Vercel Variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ALLOWED_ORIGINS`

Optional hardening flags (recommended in preview/production):

- `REQUIRE_ADMIN_MFA`
- `AUTH_CAPTCHA_MODE`
- `NEXT_PUBLIC_AUTH_CAPTCHA_MODE`
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`

Preview-only auth email control:

- `PREVIEW_AUTH_EMAILS_DISABLED`
  - Default behavior in `APP_ENV=preview`: `true` (app does not trigger outgoing auth emails).
  - Set to `false` if preview should use normal Supabase auth email delivery again.

## Release Checklist

1. Merge validated PR into `production`.
2. Confirm `CI` passes.
3. Confirm `Deploy Production DB` passes.
4. Validate login + core happy paths in production.

## Rollback

- App rollback: redeploy a previous Vercel deployment.
- DB rollback: ship a forward migration that reverts the faulty change.

## Official References

- Vercel Git deployments: <https://vercel.com/docs/deployments/git>
- GitHub Actions environments: <https://docs.github.com/actions/deployment/targeting-different-environments/using-environments-for-deployment>
- Supabase CLI: <https://supabase.com/docs/reference/cli/introduction>
- Supabase Auth settings: <https://supabase.com/docs/guides/auth>
