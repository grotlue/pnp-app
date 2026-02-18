---
name: pnp-quality-gatekeeper
description: Technology-agnostic final quality gate for pnp-app. Use before PR readiness/final handoff to enforce correctness, security, performance, test adequacy, and rollback readiness.
---

# PNP Quality Gatekeeper

Run this skill as a mandatory final gate, independent of stack details.

## Evaluate Required Dimensions

1. Correctness:
   - behavior matches requested outcome
   - no obvious regressions or broken flows
   - contracts/invariants remain valid
2. Security:
   - authorization and trust boundaries preserved
   - input handling and secret hygiene preserved
   - no unsafe automation flags or bypasses
3. Performance:
   - no obvious unnecessary complexity or N+1 behavior
   - no avoidable refetch/recompute hot paths
   - no disproportionate bundle/runtime growth without justification
4. Testing:
   - changed behavior has meaningful coverage
   - quality gates run and pass for scope
5. Operability:
   - risk notes and rollback path are present
   - docs/ADR/process updates are present where required

## Output Contract

Return a concise report with:

- `status`: `pass` or `fail`
- `required_actions`: concrete blocking actions (if fail)
- `warnings`: non-blocking improvement items
- `evidence`: checks executed and key proof points

Fail if any blocking dimension is not satisfied.
