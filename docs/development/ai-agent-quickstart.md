# AI Agent Quickstart

Developer quickstart for using project AI agents and the orchestrator workflow.

## 1) Complete Local Prerequisites

- Follow: [Local Setup and CLI Tooling](local-setup-and-cli-tooling.md)

## 2) Install Project Skills into Codex

- Use the skill sync steps in: [Local Setup and CLI Tooling](local-setup-and-cli-tooling.md)

## 3) Restart Codex

- Restart Codex after skill sync so installed skills are loaded.

## 4) Use Auto Mode (Recommended)

- Feature delivery: `yarn orchestrator:auto --prompt "implement feature xy"`
- PR review: `yarn orchestrator:auto --prompt "review PR 48"`
- Docs maintenance: `yarn orchestrator:auto --prompt "clean up docs links"`
- Optional preview without execution: `yarn orchestrator:auto --prompt "..." --dry-run --print-analysis`

Full routing and execution details: [Multi-Agent Orchestration](multi-agent-orchestration-mvp.md)

## 5) Use Planning Conversation Mode

- Planning-first conversation: `yarn orchestrator:plan --prompt "plan feature xy"`
- Execution-oriented conversation: `yarn orchestrator:chat --prompt "implement feature xy"`

## 6) Use Skill Routing in Daily Work

- Routing policy and mandatory rules: [Agent Rules](../../AGENTS.md)
- Orchestrator skill: [PNP Orchestrator Skill](../../skills/pnp-orchestrator/SKILL.md)
- Specialized skills:
  - [PNP Feature Delivery Skill](../../skills/pnp-feature-delivery/SKILL.md)
  - [PNP DB Migration Guardrails Skill](../../skills/pnp-db-migration-guardrails/SKILL.md)
  - [PNP PR Review Skill](../../skills/pnp-pr-review/SKILL.md)
  - [PNP PR Readiness Skill](../../skills/pnp-pr-readiness/SKILL.md)
  - [PNP Docs Maintainer Skill](../../skills/pnp-docs-maintainer/SKILL.md)

## 7) Typical Execution Pattern

1. Give one task with clear scope and desired outcome.
2. Let auto mode route to specialized skills.
3. Verify output with quality gates and PR checks.
