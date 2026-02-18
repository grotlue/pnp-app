# External Multi-Agent Orchestration

This runtime is effectively a single execution agent with tool parallelism, not autonomous persistent sub-agents.

Use this staged model for true multi-agent orchestration outside the runtime:

## Stage 1: Orchestrator + Specialist Workers

- One orchestrator service receives task input.
- Worker roles:
  - feature worker
  - db worker
  - docs worker
  - pr-review worker
  - pr-readiness worker
- Orchestrator assigns subtasks and merges artifacts.

## Stage 2: Shared Contract

Define strict task contract JSON:

- `task_id`
- `scope`
- `files_allowed`
- `checks_required`
- `output_schema`

Require each worker to emit structured output with:

- changed files
- commands run
- test results
- residual risks

## Stage 3: Merge Gate

Run a mandatory gate after worker completion:

- conflict detection
- lint/type/test/build
- policy checks (branch, PR template, ADR links)

Only pass to PR creation when all gates are green.

## Stage 4: Recommended Stack

- Orchestrator: Temporal or custom queue-based orchestrator
- Work queue: SQS/RabbitMQ/Redis streams
- Artifact store: Git branch + structured JSON logs
- Observability: OpenTelemetry traces + run dashboard

## Stage 5: Safety

- Assign write scopes per worker
- Enforce branch isolation
- Require deterministic rollback path per workstream
