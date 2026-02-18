---
name: pnp-feature-delivery
description: End-to-end feature and refactor delivery for pnp-app. Use when implementing code changes across app routes, page modules, features, hooks, queries, logic, and tests under AGENTS.md architecture/security/testing rules.
---

# PNP Feature Delivery

Implement product changes while preserving architecture boundaries.

## Execute Workflow

1. Confirm branch safety rules from `AGENTS.md`.
2. Locate impacted modules with `rg` and existing tests.
3. Implement minimal reversible changes.
4. Keep boundaries strict:
   - page routes stay thin
   - I/O in query modules
   - pure logic in logic modules
5. Add or update colocated tests for changed behavior.
6. Run validation:
   - `yarn typecheck`
   - `yarn lint`
   - `yarn test:run`
   - `yarn build` for release-impacting changes

## Enforce Quality

1. Avoid ad-hoc query keys; use `src/lib/client/query-keys.ts`.
2. Ensure mutation invalidations are correct.
3. Remove dead compatibility code when safe.
