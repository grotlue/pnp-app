# Multi-Agent Orchestration MVP

This is a practical external-orchestration MVP for staged worker execution with contracts and a merge gate.

Initial local prerequisites are documented in [Local Setup and CLI Tooling](local-setup-and-cli-tooling.md).
Developer quickstart for AI-agent usage is in [AI Agent Quickstart](ai-agent-quickstart.md).

## Location

- Supervisor: [Orchestrator Supervisor Script](../../scripts/multi-agent-orchestrator/supervisor.mjs)
- Example contract: [Example Task Contract](../../scripts/multi-agent-orchestrator/examples/task.mvp.json)

## Run

```bash
yarn orchestrator:example
```

Or with your own task contract:

```bash
yarn orchestrator:run --task path/to/task.json
```

Optional parallelism:

```bash
yarn orchestrator:run --task path/to/task.json --max-parallel 2
```

## Task Contract (minimum)

- `task_id`
- `title`
- `workstreams[]`

Each workstream requires:

- `name`
- `worker`
- `commands[]`
- optional `depends_on[]`
- optional `files_allowed[]` (glob patterns)

Optional merge gate:

- `checks_required`: `typecheck`, `lint`, `test:run`, `build`, `test:e2e:smoke`
- `merge_gate.required_workers[]`
- `merge_gate.policy.require_pr_template_sections`
- `merge_gate.policy.require_adr_for_architecture_changes`

## Artifacts

Run artifacts are written to:

- [Orchestrator Runs Directory](../../.orchestrator/)

Includes:

- `run-meta.json`
- per-worker logs + `result.json`
- `merge-gate-report.json`
- `run-summary.json`

## Notes

- This MVP executes in one local workspace.
- For true parallel autonomous workers, use isolated worktrees/containers + queue orchestration as described in [External Multi-Agent Orchestration Reference](../../skills/pnp-orchestrator/references/external-multi-agent-orchestration.md).
