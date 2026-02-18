# E2E Tests

Project testing conventions live in `docs/testing/e2e-strategy.md`.

## Goal

E2E tests verify critical user-visible happy paths end-to-end (UI + API + auth/session + navigation).

## Scope Rules

- Cover only the most important happy paths that prove a feature works for users.
- Keep edge cases, validation permutations, and error matrix coverage in feature/API tests.
- Prefer short deterministic scenarios over long multi-purpose test scripts.

## Runtime Prerequisites

- Domain smoke flows require local Supabase fixture data.
- Prepare the backend before running smoke locally:
  - `yarn supabase:start`
  - `yarn supabase:db:reset`
  - `yarn supabase:env:local`

## Scenario ID Contract

- Every scenario uses a stable ID in the test title:
  - `FLOW-<domain>-<slug>`
- Example:
  - `FLOW-AUTH-LOGIN-ENTRY`

## Required Tags

- `@smoke`: critical path that must run on PR CI.
- `@regression`: deeper but still user-visible path for opt-in PR regression runs.
- Domain tag for filtering/review clarity:
  - `@auth`, `@campaigns`, `@characters`, `@relationships`, `@notifications`.

## PR Triggering

- Smoke E2E runs on every PR in CI (`e2e_smoke` job).
- Regression E2E runs only when the PR has label `e2e-regression` (`e2e_regression` job).
- High-risk PRs are auto-labeled `e2e-regression` via `E2E Regression Auto-Label` workflow.

## Authoring Rules

- Assert only what users can observe (visible state, navigation result, persisted outcome).
- Use resilient Playwright locators.
- Avoid assertions on implementation internals.
- Keep test data setup explicit and isolated.

## PR Mapping Requirement

For flow-impacting PRs, map acceptance criteria/user-flow items to scenario IDs in the PR `E2E Coverage Matrix`.

## New Scenario Scaffold

- Generate a consistent scenario skeleton:
  - `yarn test:e2e:new --domain campaigns --slug request-join --level regression --description "requests to join a campaign"`
- Generator contract:
  - Scenario ID: `FLOW-<DOMAIN>-<SLUG>`
  - Required tags: `@smoke` or `@regression` plus domain tag
  - Output path defaults to `tests/e2e/<level>-<domain>-<slug>.spec.ts`

## Flaky Failure Debugging

- In CI artifact tab, download:
  - `playwright-artifacts-smoke-attempt-<n>` or `playwright-artifacts-regression-attempt-<n>`
- Inspect `playwright-report/index.html` for failed step timeline and locator snapshots.
- Inspect retry context in `test-results/**/error-context.md`.
- Open traces locally:
  - `npx playwright show-trace test-results/<scenario>/trace.zip`
- Check video evidence:
  - `test-results/**/video.webm`

## Current Smoke Baseline

- `FLOW-AUTH-LOGIN-ENTRY` (`@auth`)
- `FLOW-AUTH-PASSWORD-RESET-ENTRY` (`@auth`)
- `FLOW-CAMPAIGNS-CREATE` (`@campaigns`)
- `FLOW-CHARACTERS-CREATE-EDIT` (`@characters`)
- `FLOW-NOTIFICATIONS-MARK-READ` (`@notifications`)

## Current Regression Baseline

- `FLOW-RELATIONSHIPS-CREATE-EDIT-VIEW` (`@relationships`)
- `FLOW-CAMPAIGNS-REQUEST-JOIN` (`@campaigns`)
