# Multi-Agent Orchestration

Practical orchestration flow for this repository.

Initial local prerequisites: [Local Setup and CLI Tooling](local-setup-and-cli-tooling.md)  
Developer usage guide: [AI Agent Quickstart](ai-agent-quickstart.md)

## Recommended Mode: Auto (No Manual JSON)

Use auto mode for normal work. It analyzes your prompt, chooses a routing profile, generates a task contract, and executes it.

```bash
yarn orchestrator:auto --prompt "review PR 48"
yarn orchestrator:auto --prompt "build feature character tagging and open issue if needed"
yarn orchestrator:auto --prompt "clean up docs links and structure"
```

Useful flags:

- `--dry-run` or `--no-run`: generate contract only
- `--print-analysis`: show detected intent and selected skills
- `--profile <name>`: override routing (`pr-review`, `feature-delivery`, `docs-maintenance`)
- `--max-parallel 2`: run independent workstreams in parallel

Generated contracts are saved under `.orchestrator/contracts/`.  
You do not need to create one JSON file per task unless you want full manual control.

## Routing Behavior

Auto mode uses prompt intent + profile override.

- PR review prompts (`review PR 48`) -> `pr-review`
- Feature/refactor/fix prompts -> `feature-delivery`
- Docs/README prompts -> `docs-maintenance`
- Migration/RLS/SQL hints additionally route DB guardrails

Skill policy and mandatory routing rules are defined in [Agent Rules](../../AGENTS.md).

## Conversation Mode (Planning First)

If you want planning chat before execution:

```bash
yarn orchestrator:plan --prompt "Plan feature XY with rollout and tests"
```

Execution-oriented conversation:

```bash
yarn orchestrator:chat --prompt "Implement feature XY"
```

## Advanced Mode: Manual Contract

Use manual contracts when you need exact workstream definitions.

```bash
yarn orchestrator:run --task path/to/task.json
yarn orchestrator:run --task path/to/task.json --max-parallel 2
```

Example contract: [Example Task Contract](../../scripts/multi-agent-orchestrator/examples/task.mvp.json)

Minimum contract shape:

- `task_id`
- `title`
- `workstreams[]`

Per workstream:

- `name`
- `worker`
- `commands[]`
- optional `depends_on[]`
- optional `files_allowed[]`

Optional merge gate:

- `checks_required`: `typecheck`, `lint`, `test:run`, `build`, `test:e2e:smoke`
- `merge_gate.required_workers[]`
- `merge_gate.policy.require_pr_template_sections`
- `merge_gate.policy.require_adr_for_architecture_changes`

## Artifacts and Logs

Script locations:

- [Auto Router Script](../../scripts/multi-agent-orchestrator/auto.mjs)
- [Supervisor Script](../../scripts/multi-agent-orchestrator/supervisor.mjs)
- [Prompt Router](../../scripts/multi-agent-orchestrator/lib/prompt-router.mjs)

Run artifacts are written to [Orchestrator Runs Directory](../../.orchestrator/), including:

- `run-meta.json`
- per-worker command logs and `result.json`
- `merge-gate-report.json`
- `run-summary.json`

## Limit and Extension

This MVP executes in one local workspace.

For true parallel autonomous workers (isolated worktrees/containers + queue), see [External Multi-Agent Orchestration Reference](../../skills/pnp-orchestrator/references/external-multi-agent-orchestration.md).
