# AGENTS.md

Project guardrails for all future refactors and feature work.

## 1) Mission

Build and maintain a scalable, secure, and performant Next.js App Router application for the Phase 1 MVP domain:

- Users
- Campaigns
- Characters
- Relationships
- Notifications

## 2) Non-Negotiables

- Keep **Next.js App Router** (`src/app`).
- Keep **server-side authorization** as source of truth.
- Keep **Supabase RLS** assumptions intact.
- Keep changes incremental and reversible.
- No secrets in repo (`.env.local` + deployment env only).
- Maintain clean separation of concerns.

## 3) Source of Truth Structure

```text
src/
  app/                        # Next entry routes + app composition
    api/                      # route handlers
    app.tsx                   # runtime app wrapper (providers/router/layout wrapper)
    layout.tsx                # presentational HTML shell only
    template.tsx              # thin adapter mounting app.tsx
    router.tsx                # centralized route metadata/navigation constants
  page-modules/               # page modules (one file per screen)
  features/
    <domain>/
      components/             # presentational only
      hooks/                  # react-query/domain hooks
      queries/                # I/O only
      logic/                  # pure deterministic business logic
      types.ts
  components/
    ui/                       # shadcn primitives
    common/                   # shared composed UI
  lib/
    client/
    i18n/
    supabase/
    utils/
  server/
    auth/
    supabase/
    rate-limit/
```

## 4) Architecture Rules

### 4.1 Routing and Pages

- `src/app/**/page.tsx` must stay thin: read params/locale, render one `src/page-modules/*-page.tsx` module.
- `src/app/layout.tsx` must stay presentational (no app runtime wiring).
- Global runtime wiring belongs in `src/app/app.tsx` and is mounted via `src/app/template.tsx`.
- Route constants and navigation metadata belong in `src/app/router.tsx`.

### 4.2 Separation of Concerns

- **UI components**: no direct network/Supabase calls.
- **Queries modules**: all external I/O (API calls, persistence adapters).
- **Logic modules**: pure functions only (no I/O, no random, no env reads).
- **Hooks**: orchestrate query + mutation + invalidation; keep hooks focused.
- Features must not import from route files.

### 4.3 React Query

- Single global `QueryClientProvider` in `src/app/providers.tsx`.
- Prefer domain-scoped query keys (`["campaigns", ...]`, `["characters", ...]`).
- Mutations must invalidate relevant keys.
- Avoid duplicate fetching patterns between server/client for the same view.

## 5) Security Rules

- Never trust client gating for authorization.
- Enforce auth and permissions in route handlers/server modules.
- Keep RLS-compatible access patterns.
- Validate and sanitize route/action inputs.
- Do not expose internal errors or secrets in user-facing messages.
- Keep storage access signed/private unless explicitly public.

## 6) Performance Rules

- Avoid N+1 fetch patterns in UI flows.
- Keep heavy data shaping out of render paths (memoize derived lists where needed).
- Use React Query `staleTime`/cache intentionally; avoid unnecessary refetches.
- Minimize client bundle growth:
  - keep server-only code out of client imports
  - avoid oversized dependencies
- Prefer pagination/limits for large lists where applicable.

## 7) DX and Naming Conventions

- File names: kebab-case.
- Page modules: `*-page.tsx`.
- Hooks: `use-*.ts`.
- Query modules: `*.query.ts` / `*.mutation.ts`.
- Tests must live in a `tests/` subfolder next to the module/route they validate.
  - Example: `src/features/campaigns/queries/tests/get-campaigns.query.test.ts`
- Keep TypeScript strictness intact.

## 8) Testing and Quality Gates

Before merging significant work, ensure:

```bash
yarn typecheck
yarn lint
yarn test:run
yarn build
```

Minimum expectations:

- new logic: unit tests where feasible
- regression-prone flows: integration-style tests where practical
- no unresolved lint/type errors

## 9) Migration and Refactor Safety

- Do not rewrite large areas in one step.
- Prefer move-first, then refactor, then cleanup.
- Keep imports stable where possible.
- Remove dead compatibility layers once safe.

## 10) Documentation Policy

- Keep architecture docs in **one place**: `docs/app-architecture.md`.
- Update docs when changing:
  - folder conventions
  - data flow patterns
  - security-critical behavior
  - query/caching strategy

## 11) Branching Strategy

- Use short-lived branches only.
- Never implement changes directly on `main` or `production`.
- Branch names:
  - `feat/<scope>-<short-description>`
  - `fix/<scope>-<short-description>`
  - `refactor/<scope>-<short-description>`
  - `chore/<scope>-<short-description>`
- Keep one branch focused on one concern. Do not mix schema, API, and large UI redesign in the same PR unless required.

### 11.1) Mandatory Agent Branch Safety

When working as an automated coding agent:

- At task start, check current branch before any edits.
- If current branch is `main` or `production`, create a new working branch first.
- If current task scope does not fit the current working branch scope, ask whether to create a new branch.
- If user confirms, create the new branch before making changes.

### 11.2) Branch Scope Rules

- One branch = one coherent change package.
- Prefer opening a new branch when switching from:
  - infra/deploy work -> product feature work
  - backend/data model work -> unrelated UI redesign
  - bugfix work -> refactor-only work

## 12) Commit Conventions

- Use Conventional Commit style:
  - `feat(scope): ...`
  - `fix(scope): ...`
  - `refactor(scope): ...`
  - `test(scope): ...`
  - `docs(scope): ...`
  - `chore(scope): ...`
- Commit messages must describe intent, not just file moves.
- Keep commits atomic and reversible.
- No `WIP` commits on review-ready branches.

## 13) Pull Request Checklist

Before opening or merging a PR, ensure all points are addressed:

- Scope is clear and limited.
- Security impact reviewed (auth, RLS, input validation, data exposure).
- Performance impact reviewed (query count, payload size, avoid unnecessary refetching).
- Data model / migration impact documented (if any).
- Quality gates pass:
  - `yarn typecheck`
  - `yarn lint`
  - `yarn test:run`
  - `yarn build`
- Screenshots or short video for user-facing UI changes.
- Manual test steps included for changed flows.
- Documentation updated if architecture, behavior, or conventions changed.

### 13.1) Mandatory PR Creation

- After a coherent change package is complete, open a Pull Request.
- Do not leave completed work only on a local branch.
- PR title should follow conventional commit intent (`feat(...)`, `fix(...)`, `refactor(...)`, `docs(...)`, `chore(...)`).
- PR description must include:
  - scope summary
  - test/verification results
  - risk notes

## 14) Definition of Done

A task is done only when all conditions are met:

- Functional requirements implemented.
- Server-side permission checks are correct.
- Client-side behavior matches UX requirements (loading, success/error feedback, redirects).
- No direct data-access leakage into presentational UI components.
- No new lint/type errors and no broken tests.
- No critical performance regressions introduced.
- Relevant docs updated (`docs/app-architecture.md`, feature docs, setup notes).

## 15) Review Focus (Default)

Code reviews should prioritize:

- Correctness and regression risk.
- Security and authorization boundaries.
- Data access boundaries (queries/hooks/UI separation).
- Query performance and cache invalidation correctness.
- Test adequacy for changed behavior.
