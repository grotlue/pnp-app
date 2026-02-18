const KNOWN_CHECKS = new Set([
  "typecheck",
  "lint",
  "test:run",
  "build",
  "test:e2e:smoke",
]);

export function sanitizeRunId(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-");
}

export function validateTaskContract(task) {
  const errors = [];

  if (!task || typeof task !== "object") {
    errors.push("Task contract must be an object.");
    return errors;
  }

  if (!isNonEmptyString(task.task_id)) {
    errors.push("task_id is required.");
  }

  if (!isNonEmptyString(task.title)) {
    errors.push("title is required.");
  }

  if (!Array.isArray(task.workstreams) || task.workstreams.length === 0) {
    errors.push("workstreams must be a non-empty array.");
    return errors;
  }

  const names = new Set();

  for (const workstream of task.workstreams) {
    if (!isNonEmptyString(workstream.name)) {
      errors.push("Each workstream requires a non-empty name.");
      continue;
    }

    if (names.has(workstream.name)) {
      errors.push(`Duplicate workstream name: ${workstream.name}`);
    }
    names.add(workstream.name);

    if (!isNonEmptyString(workstream.worker)) {
      errors.push(`Workstream ${workstream.name} requires worker.`);
    }

    if (
      !Array.isArray(workstream.commands) ||
      workstream.commands.length === 0
    ) {
      errors.push(
        `Workstream ${workstream.name} requires at least one command.`,
      );
    } else if (
      workstream.commands.some((command) => !isNonEmptyString(command))
    ) {
      errors.push(`Workstream ${workstream.name} has invalid command entry.`);
    }

    if (
      workstream.files_allowed &&
      (!Array.isArray(workstream.files_allowed) ||
        workstream.files_allowed.some((pattern) => !isNonEmptyString(pattern)))
    ) {
      errors.push(
        `Workstream ${workstream.name} has invalid files_allowed patterns.`,
      );
    }

    if (
      workstream.depends_on &&
      (!Array.isArray(workstream.depends_on) ||
        workstream.depends_on.some(
          (dependency) => !isNonEmptyString(dependency),
        ))
    ) {
      errors.push(`Workstream ${workstream.name} has invalid depends_on list.`);
    }
  }

  for (const workstream of task.workstreams) {
    for (const dependency of workstream.depends_on ?? []) {
      if (!names.has(dependency)) {
        errors.push(
          `Workstream ${workstream.name} depends_on unknown workstream: ${dependency}`,
        );
      }
    }
  }

  const checks = normalizeChecks(task.checks_required ?? []);
  if (checks.invalid.length > 0) {
    errors.push(
      `Unknown checks_required entries: ${checks.invalid.join(", ")}. Allowed: ${[
        ...KNOWN_CHECKS,
      ].join(", ")}`,
    );
  }

  if (task.execution_policy !== undefined) {
    if (!task.execution_policy || typeof task.execution_policy !== "object") {
      errors.push("execution_policy must be an object when provided.");
    } else {
      const { execution_policy: executionPolicy } = task;

      if (
        executionPolicy.allow_destructive_commands !== undefined &&
        typeof executionPolicy.allow_destructive_commands !== "boolean"
      ) {
        errors.push(
          "execution_policy.allow_destructive_commands must be boolean.",
        );
      }

      if (
        executionPolicy.approval_policy !== undefined &&
        !isNonEmptyString(executionPolicy.approval_policy)
      ) {
        errors.push("execution_policy.approval_policy must be a string.");
      }

      if (
        executionPolicy.risk_tier !== undefined &&
        !isNonEmptyString(executionPolicy.risk_tier)
      ) {
        errors.push("execution_policy.risk_tier must be a string.");
      }

      if (
        executionPolicy.risk_reasons !== undefined &&
        (!Array.isArray(executionPolicy.risk_reasons) ||
          executionPolicy.risk_reasons.some(
            (reason) => !isNonEmptyString(reason),
          ))
      ) {
        errors.push(
          "execution_policy.risk_reasons must be an array of strings.",
        );
      }
    }
  }

  return errors;
}

export function normalizeChecks(checksRequired) {
  const checks = Array.isArray(checksRequired) ? checksRequired : [];
  const valid = [];
  const invalid = [];

  for (const check of checks) {
    if (!isNonEmptyString(check)) {
      invalid.push(String(check));
      continue;
    }

    if (KNOWN_CHECKS.has(check)) {
      valid.push(check);
      continue;
    }

    invalid.push(check);
  }

  return {
    valid,
    invalid,
  };
}

export function resolveExecutionStages(workstreams) {
  const workstreamMap = new Map(workstreams.map((item) => [item.name, item]));
  const pending = new Set(workstreamMap.keys());
  const resolved = new Set();
  const stages = [];

  while (pending.size > 0) {
    const stage = [];

    for (const name of pending) {
      const workstream = workstreamMap.get(name);
      const dependencies = workstream?.depends_on ?? [];
      const canRun = dependencies.every((dependency) =>
        resolved.has(dependency),
      );

      if (canRun) {
        stage.push(name);
      }
    }

    if (stage.length === 0) {
      throw new Error("Dependency cycle detected in workstreams.");
    }

    stages.push(stage);

    for (const name of stage) {
      pending.delete(name);
      resolved.add(name);
    }
  }

  return stages;
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

export const CHECK_COMMANDS = {
  typecheck: "yarn typecheck",
  lint: "yarn lint",
  "test:run": "yarn test:run",
  build: "yarn build",
  "test:e2e:smoke": "yarn test:e2e --grep @smoke",
};
