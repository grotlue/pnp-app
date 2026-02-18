## Summary

- What changed and why?

## Linked Issue(s)

- #123
- If no issue exists, write: `No linked issue`

## Flow Impact

- [ ] No user-flow impact
- [ ] Existing flow changed
- [ ] New flow added

## Impact Signals (Regression Auto-Label)

- [ ] Security impact
- [ ] Data model impact
- [ ] Performance impact

## E2E Coverage Matrix

| AC / User Flow Ref | Scenario ID      | Test status              | Why E2E vs feature test          |
| ------------------ | ---------------- | ------------------------ | -------------------------------- |
| AC-1               | FLOW-domain-slug | Existing / Updated / New | Critical user-visible happy path |

## PR Acceptance Criteria (Required When No Linked Issue)

- ...

## PR Happy Paths (Required When No Linked Issue)

- ...

## Scope

- [ ] One coherent change package
- [ ] Branch created from latest `main`

## Verification

- [ ] `yarn typecheck`
- [ ] `yarn lint`
- [ ] `yarn test:run`
- [ ] `yarn build` (required for release-impacting changes)
- [ ] `yarn test:e2e --grep @smoke` (for flow-impacting changes)

## Documentation

- [ ] Relevant docs updated when conventions/behavior changed
- [ ] ADR linked or rationale given when architecture/security/runtime boundaries changed

## Risk and Rollback

- Risk notes:
- Rollback approach:

## Agent Automation Safety (when applicable)

- [ ] No sandbox/approval bypass flags used
- [ ] High-risk or destructive overrides (`--confirm-risky`, `--allow-destructive`) documented with rationale
