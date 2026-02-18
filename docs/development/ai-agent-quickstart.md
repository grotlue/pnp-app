# AI Agent Quickstart

Developer quickstart for using project AI agents and the orchestrator workflow.

## 1) Complete Local Prerequisites

- Follow: [`docs/development/local-setup-and-cli-tooling.md`](local-setup-and-cli-tooling.md)

## 2) Install Project Skills into Codex

- Use the skill sync steps in: [`docs/development/local-setup-and-cli-tooling.md`](local-setup-and-cli-tooling.md)

## 3) Restart Codex

- Restart Codex after skill sync so installed skills are loaded.

## 4) Run the External Orchestrator MVP

- Run example: `yarn orchestrator:example`
- Full usage and task contract: [`docs/development/multi-agent-orchestration-mvp.md`](multi-agent-orchestration-mvp.md)

## 5) Use Skill Routing in Daily Work

- Routing policy and mandatory rules: [`AGENTS.md`](../../AGENTS.md)
- Orchestrator skill: [`skills/pnp-orchestrator/SKILL.md`](../../skills/pnp-orchestrator/SKILL.md)
- Specialized skills:
  - [`skills/pnp-feature-delivery/SKILL.md`](../../skills/pnp-feature-delivery/SKILL.md)
  - [`skills/pnp-db-migration-guardrails/SKILL.md`](../../skills/pnp-db-migration-guardrails/SKILL.md)
  - [`skills/pnp-pr-review/SKILL.md`](../../skills/pnp-pr-review/SKILL.md)
  - [`skills/pnp-pr-readiness/SKILL.md`](../../skills/pnp-pr-readiness/SKILL.md)
  - [`skills/pnp-docs-maintainer/SKILL.md`](../../skills/pnp-docs-maintainer/SKILL.md)

## 6) Typical Execution Pattern

1. Give one task with clear scope and desired outcome.
2. Let the orchestrator route to specialized skills.
3. Verify output with quality gates and PR checks.
