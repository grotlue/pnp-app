# App Architecture

## Goals

- Keep Next.js App Router as runtime and routing entrypoint.
- Keep UI, I/O, and business logic separated.
- Keep authorization server-side and compatible with Supabase RLS.

## Directory Model

```text
src/
  app/                  # route entries + app composition
  page-modules/         # one module per screen
  features/<domain>/    # components, hooks, queries, logic, types
  components/           # shared UI
  lib/                  # cross-domain client/shared helpers
  server/               # server-only auth/supabase/security helpers
```

## Runtime Boundaries

- `src/app/**/page.tsx`: thin entry points only.
- `src/page-modules/*-page.tsx`: screen composition.
- `src/features/*/queries`: all external I/O.
- `src/features/*/logic`: pure deterministic logic.
- `src/features/*/hooks`: query + mutation orchestration.

## React Query

- Global provider in `src/app/providers.tsx`.
- Canonical query keys in `src/lib/client/query-keys.ts`.
- Mutations must invalidate relevant keys.

## Security Model

- Server-side authorization is source of truth.
- Supabase RLS enforces data access.
- Route handlers validate input and avoid leaking internal errors.
- Auth/session-sensitive endpoints return `no-store`.

## Testing Layout

- Unit/integration tests in colocated `tests/` folders.
- E2E tests under `tests/e2e/`.
- Testing policy and tags: [`docs/testing/e2e-strategy.md`](testing/e2e-strategy.md).

## Decision Log

- Architecture-significant decisions are tracked as ADRs in [`docs/development/decisions/README.md`](development/decisions/README.md).
