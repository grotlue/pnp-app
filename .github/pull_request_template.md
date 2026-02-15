## Summary

Describe what changed and why.

## Scope

- [ ] Scope is focused and limited to one primary concern
- [ ] No unrelated refactors mixed in

## Architecture

- [ ] Changes follow `AGENTS.md` and `docs/app-architecture.md`
- [ ] `src/app/**/page.tsx` remains thin (entry + composition)
- [ ] UI does not perform direct data access (use feature hooks/queries)
- [ ] Features do not import from route files

## Security

- [ ] Server-side authorization checks are correct
- [ ] RLS assumptions remain valid
- [ ] Inputs are validated/sanitized
- [ ] No sensitive data/secrets exposed

## Performance

- [ ] No obvious N+1 or unnecessary refetch patterns introduced
- [ ] Query invalidation/caching strategy is correct
- [ ] No unnecessary bundle bloat introduced

## Data / Migrations

- [ ] No schema change
- [ ] Schema change included and documented
- [ ] Migration tested locally (`yarn supabase:db:reset`)

## Testing

- [ ] Added/updated tests where behavior changed
- [ ] Manual test steps provided below

### Manual Test Steps

1.
2.
3.

## Quality Gates

- [ ] `yarn typecheck`
- [ ] `yarn lint`
- [ ] `yarn test:run`
- [ ] `yarn build`

## UI Evidence (if UI changed)

- [ ] Screenshot(s) attached
- [ ] Short video attached
- [ ] Not applicable

## Documentation

- [ ] No doc changes needed
- [ ] Updated docs (`docs/app-architecture.md` and/or relevant docs)

## Definition of Done

- [ ] Functional requirements are complete
- [ ] Error/loading/success UX states are handled
- [ ] No known regressions remaining
