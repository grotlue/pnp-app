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
- Interactive flows use `useQuery` / `useMutation` in feature hooks.
- Mutations invalidate domain query keys.

## Security

- Server-side authorization is enforced in API route handlers.
- Client-side guards are only UX-level (redirect/gating).
- Supabase RLS remains the primary data access control layer.

## Feature Flags

- Runtime feature flags are centralized in `src/lib/features/feature-flags.ts`.
- Flags can be enabled/disabled per environment (`development`, `preview`, `production`).
- Registration is disabled by default in `production` via `selfRegistration`.
- Optional overrides:
  - `FEATURE_FLAGS_ENABLE` (comma-separated)
  - `FEATURE_FLAGS_DISABLE` (comma-separated)
  - `APP_ENV` to force runtime environment resolution.

## Naming Conventions

- Files: kebab-case.
- Page modules: `*-page.tsx`.
- Hooks: `use-*.ts`.
- Domain types: `features/<domain>/types.ts`.
- Tests: place in `tests/` subfolders next to the code under test.
