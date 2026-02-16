# App Architecture

## Goals

- Keep Next.js App Router as the runtime routing system.
- Keep UI, data access, and business logic clearly separated.
- Keep pages easy to find and edit.

## Directory Layout

```text
src/
  app/                          # Next.js entry routes + app composition
    api/                        # route handlers
    app.tsx                     # app-level runtime composition
    layout.tsx                  # root HTML layout (presentational)
    template.tsx                # thin Next.js adapter to app.tsx
    router.tsx                  # centralized route metadata
    providers.tsx               # QueryClient provider
  page-modules/                 # page modules (one file per screen)
  features/
    <domain>/
      components/               # presentational components
      hooks/                    # React Query/domain hooks
      queries/                  # I/O only (API/Supabase adapters)
      logic/                    # pure deterministic logic
      types.ts
  components/
    ui/                         # shadcn/ui primitives
    common/                     # shared composed components
  lib/
    client/                     # client session/api helpers
    logic/                      # shared pure helper logic (e.g. hasItems)
    features/                   # runtime feature flags
    i18n/                       # localization helpers
    supabase/                   # browser supabase setup
    utils/
  server/
    auth/
    supabase/
    rate-limit/
```

## Routing Model

- `src/app/**/page.tsx` files are thin entry points.
- Each entry point renders one module from `src/page-modules/*-page.tsx`.
- `src/app/router.tsx` contains route constants/navigation metadata.
- `src/app/layout.tsx` stays presentational (HTML shell).
- `src/app/app.tsx` contains app-level runtime composition (providers/layout wrapper).
- `src/app/template.tsx` mounts `app.tsx` for all routes.

## Separation of Concerns

- UI components do not call Supabase directly.
- Data access lives in `features/*/queries`.
- Pure business rules live in `features/*/logic`.
- Route/page modules orchestrate hooks and presentation.
- Features do not import from `src/app`.

## React Query

- One global provider: `src/app/providers.tsx`.
- Query keys are centralized in `src/lib/client/query-keys.ts`.
- Interactive flows use `useQuery` / `useMutation` in feature hooks.
- Mutations invalidate domain query keys.
- Prefer shared hooks for common identity reads (e.g. `use-me-query`) to avoid duplicate fetches.

## Loading UX

- Reusable loading card lives in `src/components/common/page-loading-state.tsx`.
- Use dedicated i18n keys for loading contexts:
  - `ui.loading.page`
  - `ui.loading.section`
  - `ui.loading.auth`

## Security

- Server-side authorization is enforced in API route handlers.
- Client-side guards are only UX-level (redirect/gating).
- Supabase RLS remains the primary data access control layer.
- Admin-only routes use explicit server-side admin checks (`requireAdmin`).
- Service role access is limited to server-only modules (`src/server/supabase/*`).
- Auth-sensitive endpoints use server rate limiting (`src/server/rate-limit/*`).
- Auth input hardening is centralized (`src/lib/api/auth-validation.ts`):
  - email normalization/validation
  - password complexity checks
  - captcha token normalization
- API responses are marked `no-store` via shared HTTP/security helpers.
- Access tokens are accepted from bearer headers and secure HttpOnly cookies.
- Security headers (including CSP) are applied centrally via `src/proxy.ts`.
- New public-schema tables must enable RLS in the same migration.
- Admin APIs enforce role checks plus MFA `aal2` session level in preview/production by default.
- Auth CAPTCHA support is centralized and env-driven (`AUTH_CAPTCHA_MODE`, `NEXT_PUBLIC_AUTH_CAPTCHA_MODE`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`).
- Admin MFA setup/verification flow is available in settings and backed by `GET/POST/PATCH /api/auth/mfa/totp`.

## API Patterns

- Use bootstrap/context endpoints for high-latency screens:
  - Admin dashboard: `GET /api/admin/bootstrap`
- Prefer fetching exactly-needed payloads over loading multiple global lists.
- Keep route handler validation and error response logic centralized in `src/lib/api/*`.
- Vercel Speed Insights is mounted in `src/app/layout.tsx` and defaults to enabled in preview/production.
- Supabase built-in observability should be used for DB-side performance analysis (linter, outliers, query stats).

## Runtime Boundary

- Product APIs stay in Next.js Route Handlers (`src/app/api/**`) as the default backend runtime.
- Supabase Edge Functions are optional and reserved for specific non-default use cases:
  - external webhooks
  - asynchronous/background jobs
  - narrowly scoped tasks that benefit from explicit Supabase-side execution
- Keep one source of truth for authz/RLS semantics regardless of runtime.

## Database Guardrails

- Every new foreign key in `public` must ship with a covering index in the same migration.
- CI enforces this via `db_schema_guardrails` (`supabase db reset --local` + `scripts/check-unindexed-foreign-keys.sh`).
- Keep `supabase db lint --schema public --fail-on warning` clean for warning/error-level checks.
- Treat `unused_index` findings as review input over representative traffic before dropping indexes.

## Feature Flags

- Runtime feature flags are centralized in `src/lib/features/feature-flags.ts`.
- Flags can be enabled/disabled per environment (`development`, `preview`, `production`).
- Registration is disabled by default in `production` via `selfRegistration`.
- Feature provider strategy supports:
  - `rules` (default/fallback provider)
  - `vercel` (via `flags-sdk.dev` + `@flags-sdk/vercel`)
- Vercel Toolbar integration:
  - Toolbar script injected in `src/app/layout.tsx`
  - Next plugin enabled in `next.config.ts`
  - Flags discovery endpoint at `src/app/.well-known/vercel/flags/route.ts`
- Optional overrides:
  - `FEATURE_FLAGS_ENABLE` (comma-separated)
  - `FEATURE_FLAGS_DISABLE` (comma-separated)
  - `APP_ENV` to force runtime environment resolution
  - `FEATURE_FLAGS_PROVIDER` to select provider (`rules` or `vercel`)
  - `FLAGS` (Vercel flags connection string, required for Vercel provider)
  - `FLAGS_SECRET` (required for Flags Explorer / encrypted toolbar overrides)
  - `NEXT_PUBLIC_ENABLE_VERCEL_TOOLBAR` (optional manual toggle outside development)

## Naming Conventions

- Files: kebab-case.
- Page modules: `*-page.tsx`.
- Hooks: `use-*.ts`.
- Domain types: `features/<domain>/types.ts`.
- Tests: place in `tests/` subfolders next to the code under test.
