---
name: pnp-pr-readiness
description: PR completion and compliance workflow for pnp-app. Use before creating or updating a PR to verify scope, quality gates, documentation/ADR requirements, and PR template completeness.
---

# PNP PR Readiness

Prepare a branch for merge review.

## Execute Workflow

1. Confirm branch scope is coherent.
2. Run required checks:
   - `yarn typecheck`
   - `yarn lint`
   - `yarn test:run`
   - `yarn build` when release-impacting
3. Ensure PR template fields are filled, especially:
   - flow impact
   - E2E matrix for flow-impacting changes
   - risk and rollback
4. Ensure docs updates are included when conventions/behavior changed.
5. Ensure ADR link or rationale exists for architecture/security/runtime boundary changes.

## Output Format

Return a concise readiness report:

- `ready` or `not ready`
- failing checks
- missing template fields
- required follow-up actions
