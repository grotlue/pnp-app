# AI Agent Quickstart

Developer quickstart for using project AI agents and the orchestrator workflow.

## What To Use For What

| You want to...                                  | Use this                                                              | Why                                          |
| ----------------------------------------------- | --------------------------------------------------------------------- | -------------------------------------------- |
| Build a feature/fix with minimal overhead       | `yarn orchestrator:auto --prompt "implement <task>"`                  | Best default. Auto-routes to required skills |
| Review PR quality and risks                     | `yarn orchestrator:auto --prompt "review PR <number>"`                | Uses review/readiness flow                   |
| Discuss and shape the solution first            | `yarn orchestrator:plan --prompt "plan <task>"`                       | Planning conversation before file mutations  |
| Work interactively with direct execution intent | `yarn orchestrator:chat --prompt "<task>"`                            | Conversational execution mode                |
| Check routing/profile selection before run      | `yarn orchestrator:auto --prompt "<task>" --dry-run --print-analysis` | Safe preview of skill orchestration          |
| Control every workstream manually               | `yarn orchestrator:run --task path/to/task.json`                      | Advanced custom orchestration                |

Recommended default for most tasks: `orchestrator:auto`.

## Safety Defaults You Should Know

- High-risk prompts (destructive actions or secret/credential access) are blocked unless you add `--confirm-risky`.
- Destructive command patterns are blocked unless `--allow-destructive` is explicitly provided.
- `orchestrator:plan` and `orchestrator:chat` run with `--approval-policy untrusted` by default.
- `orchestrator:auto` defaults to `on-request`; for stricter control, add `--approval-policy untrusted`.
- Keep using sandboxed execution (`workspace-write`), do not bypass approvals/sandbox.

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
  - [PNP Quality Gatekeeper Skill](../../skills/pnp-quality-gatekeeper/SKILL.md)
  - [PNP PR Review Skill](../../skills/pnp-pr-review/SKILL.md)
  - [PNP PR Readiness Skill](../../skills/pnp-pr-readiness/SKILL.md)
  - [PNP Docs Maintainer Skill](../../skills/pnp-docs-maintainer/SKILL.md)

## 7) Typical Execution Pattern

1. Give one task with clear scope and desired outcome.
2. Let auto mode route to specialized skills.
3. Verify output with quality gates and PR checks.

## Example Prompts

- `yarn orchestrator:auto --prompt "implement campaign invitation acceptance flow incl. tests"`
- `yarn orchestrator:auto --prompt "review PR 48 with focus on security and regressions"`
- `yarn orchestrator:plan --prompt "plan rollout for notification preferences feature"`

## Use A Single Skill Directly

When you do not want full routing, call one skill explicitly in the prompt.

- Orchestrator skill only:
  - `codex --sandbox workspace-write -a untrusted "Use pnp-orchestrator as primary skill. Task: <your task>"`
- PR review skill only:
  - `codex exec --sandbox workspace-write --ask-for-approval untrusted "Use pnp-pr-review as primary skill. Review PR 48 and output findings by severity."`
- Docs maintainer skill only:
  - `codex exec --sandbox workspace-write --ask-for-approval untrusted "Use pnp-docs-maintainer as primary skill. Clean up docs links and remove duplication."`

Skill definitions and responsibilities:

- [PNP Orchestrator Skill](../../skills/pnp-orchestrator/SKILL.md)
- [PNP Feature Delivery Skill](../../skills/pnp-feature-delivery/SKILL.md)
- [PNP DB Migration Guardrails Skill](../../skills/pnp-db-migration-guardrails/SKILL.md)
- [PNP Quality Gatekeeper Skill](../../skills/pnp-quality-gatekeeper/SKILL.md)
- [PNP PR Review Skill](../../skills/pnp-pr-review/SKILL.md)
- [PNP PR Readiness Skill](../../skills/pnp-pr-readiness/SKILL.md)
- [PNP Docs Maintainer Skill](../../skills/pnp-docs-maintainer/SKILL.md)
