---
name: pnp-orchestrator
description: Boss-agent orchestration for pnp-app. Use when a request spans multiple concerns (feature + DB + tests + docs + PR), when the user asks for end-to-end execution, or when work must be routed to specialized skills and consolidated into one delivery.
---

# PNP Orchestrator

Use this skill as the top-level controller. Route work to specialized skills, collect outputs, and publish one consolidated result.

Preferred entrypoints:

- `yarn orchestrator:auto --prompt "<task>"` for automatic routing/execution
- `yarn orchestrator:plan --prompt "<task>"` for planning-first conversations

## Use Routing Rules

1. Use `pnp-feature-delivery` for product/code changes.
2. Use `pnp-db-migration-guardrails` when migrations, RLS, policies, DB lint, or outlier checks are involved.
3. Use `pnp-docs-maintainer` when `README`, `docs/*`, or `AGENTS.md` changes are requested.
4. Use `pnp-pr-review` when the user asks for a review or regression-risk analysis.
5. Use `pnp-pr-readiness` before opening/updating a PR.

## Execute Workflow

1. Classify the task into workstreams.
2. Sequence workstreams by dependency:
   - implementation before readiness
   - migrations before app code that depends on them
   - docs after behavior is finalized
3. Run each workstream using the mapped specialized skill.
4. Merge outputs into one status update with:
   - implemented changes
   - verification results
   - risks and rollback
5. Ensure branch/PR constraints from `AGENTS.md` remain satisfied.

## Skill Disclosure (Mandatory)

1. At the start of every new user task, explicitly state the primary skill being used.
2. Explicitly list any routed subskills and the one-line reason for the chosen order.
3. If no subskills are used, explicitly state that no subskill routing is required.
4. Keep this disclosure concise (one short line) and place it before substantive execution updates.

## Enforce Completion Standard

1. Do not stop at planning unless asked.
2. Prefer execution + validation + PR update in one run.
3. Keep commits reversible and scoped by concern.

## External Multi-Agent Mode

For true parallel multi-agent architecture outside this runtime, use `references/external-multi-agent-orchestration.md`.
