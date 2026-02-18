# Branching and PR Workflow

## Rules

- Never commit feature work directly on `main` or `production`.
- Keep one coherent change package per branch.
- Branch from the latest `main`.
- Open a PR when the package is complete.

## Branch Name Format

- `feat/<scope>-<short-description>`
- `fix/<scope>-<short-description>`
- `refactor/<scope>-<short-description>`
- `chore/<scope>-<short-description>`
- `docs/<scope>-<short-description>`

## Standard Flow

1. Update `main`:
   - `git checkout main`
   - `git pull --ff-only origin main`
2. Create the branch.
3. Implement and verify:
   - `yarn typecheck`
   - `yarn lint`
   - `yarn test:run`
   - `yarn build` (release-impacting changes)
   - `yarn test:e2e --grep @smoke` (flow-impacting changes)
   - `supabase db lint --linked --schema public --fail-on warning` (DB/RLS changes)
4. Commit with Conventional Commit messages.
5. Open PR with scope, verification results, and risk notes.
