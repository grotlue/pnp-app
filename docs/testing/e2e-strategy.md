# E2E Strategy

E2E tests cover critical user-visible happy paths end-to-end (UI + API + auth/session).

## Scope

- Keep E2E focused on core flows only.
- Cover edge/error permutations in feature/API tests.
- Use deterministic short scenarios.

## Scenario Contract

- Scenario IDs in titles: `FLOW-<domain>-<slug>`
- Required tags:
  - `@smoke` for PR CI
  - `@regression` for broader manually triggered suites
  - domain tags (`@auth`, `@campaigns`, `@characters`, `@relationships`, `@notifications`)

## Local Prerequisites

```bash
yarn supabase:start
yarn supabase:db:reset
yarn supabase:env:local
yarn test:e2e --grep @smoke
```

## PR Requirement

Flow-impacting PRs must fill the E2E Coverage Matrix in the [PR template](../../.github/pull_request_template.md).

## Regression Triggering

- `@smoke` runs on all PRs in CI.
- `@regression` runs when PR label `e2e-regression` is present.
- CI E2E runs set `REQUIRE_ADMIN_MFA=true` to keep admin MFA step-up flows covered in smoke.
- High-risk PRs are auto-labeled via `.github/workflows/e2e-regression-autolabel.yml` based on:
  - PR template impact signals (`Security`, `Data model`, `Performance`)
  - sensitive path changes (`src/app/api/**`, `server/auth/**`, `supabase/migrations/**`, etc.)

## Scenario Scaffolding

Use the scaffold generator for consistent IDs/tags:

```bash
yarn test:e2e:new --domain campaigns --slug request-join --level regression --description "requests to join a campaign"
```
