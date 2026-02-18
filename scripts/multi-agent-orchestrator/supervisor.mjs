#!/usr/bin/env node

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import {
  CHECK_COMMANDS,
  normalizeChecks,
  resolveExecutionStages,
  sanitizeRunId,
  validateTaskContract,
} from "./lib/contract-utils.mjs";
import { matchesAnyGlob } from "./lib/glob-utils.mjs";
import { getWorkingTreeFiles } from "./lib/git-utils.mjs";
import { runShellCommand } from "./lib/command-utils.mjs";
import {
  normalizeTailLines,
  readLogTail,
  summarizeCommand,
} from "./lib/log-utils.mjs";
import { evaluateCommandSafety } from "./lib/safety-utils.mjs";

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printUsage();
    return;
  }

  if (!args.taskPath) {
    fail("Missing --task <path-to-task-contract.json>");
  }

  const cwd = process.cwd();
  const taskPath = resolve(cwd, args.taskPath);
  const task = parseJson(taskPath);
  const validationErrors = validateTaskContract(task);

  if (validationErrors.length > 0) {
    fail(
      ["Task contract validation failed:", ...validationErrors].join("\n- "),
    );
  }

  const executionPolicy = resolveExecutionPolicy(task, args);
  const safetyReport = evaluateCommandSafety(task.workstreams, {
    allowDestructiveCommands: executionPolicy.allow_destructive_commands,
  });
  if (safetyReport.violations.length > 0) {
    fail(
      [
        "Command safety validation failed.",
        ...safetyReport.violations.map(
          (violation) =>
            `${violation.workstream}: ${violation.rule_id} (${violation.message}) -> ${violation.command}`,
        ),
      ].join("\n- "),
    );
  }

  const runId = `${Date.now()}-${sanitizeRunId(task.task_id)}`;
  const runDir = resolve(cwd, ".orchestrator", "runs", runId);
  mkdirSync(runDir, { recursive: true });

  const runMeta = {
    run_id: runId,
    started_at: new Date().toISOString(),
    task_id: task.task_id,
    task_title: task.title,
    task_path: taskPath,
    max_parallel: args.maxParallel,
    execution_policy: executionPolicy,
    command_safety: {
      violations: safetyReport.violations.length,
    },
  };
  writeJson(join(runDir, "run-meta.json"), runMeta);

  const workstreamMap = new Map(
    task.workstreams.map((item) => [item.name, item]),
  );
  const stages = resolveExecutionStages(task.workstreams);
  const workstreamResults = [];
  const interruptState = {
    requested: false,
  };
  const signalHandler = createSigintHandler(interruptState);
  process.on("SIGINT", signalHandler);

  try {
    if (args.maxParallel > 1) {
      console.log(
        "[orchestrator] max_parallel > 1 uses same working tree. Prefer isolated worktrees for true parallel workers.",
      );
    }

    for (const stage of stages) {
      if (interruptState.requested) {
        break;
      }

      if (args.verbose) {
        console.log(
          `[orchestrator] starting stage: ${stage.join(", ")} (${stage.length} workstream(s))`,
        );
      }

      const stageWorkstreams = stage.map((name) => workstreamMap.get(name));
      const stageResults = await runWithConcurrency(
        stageWorkstreams,
        args.maxParallel,
        async (workstream) =>
          runWorkstream(workstream, {
            cwd,
            runDir,
            taskId: task.task_id,
            verbose: args.verbose,
            tailLines: args.tailLines,
            interruptState,
          }),
        () => interruptState.requested,
      );

      workstreamResults.push(...stageResults);

      const hasFailure = stageResults.some(
        (result) => result.status === "failure",
      );
      const hasInterrupted = stageResults.some(
        (result) => result.status === "interrupted",
      );

      if (hasInterrupted || interruptState.requested) {
        console.log(
          "[orchestrator] run interrupted; stopping remaining stages.",
        );
        break;
      }

      if (hasFailure) {
        console.log("[orchestrator] stage failed; stopping remaining stages.");
        break;
      }

      if (args.verbose) {
        console.log("[orchestrator] stage completed.");
      }
    }

    const mergeGate = await runMergeGate(task, workstreamResults, {
      cwd,
      runDir,
      verbose: args.verbose,
      tailLines: args.tailLines,
      interruptState,
    });

    const summary = {
      task_id: task.task_id,
      run_id: runId,
      started_at: runMeta.started_at,
      finished_at: new Date().toISOString(),
      execution_policy: executionPolicy,
      workstream_results: workstreamResults,
      merge_gate: mergeGate,
      status: interruptState.requested ? "interrupted" : mergeGate.status,
    };

    writeJson(join(runDir, "run-summary.json"), summary);
    console.log(
      `[orchestrator] summary written to ${join(runDir, "run-summary.json")}`,
    );

    if (summary.status === "interrupted") {
      process.exit(130);
    }

    if (summary.status !== "success") {
      process.exit(1);
    }
  } finally {
    process.off("SIGINT", signalHandler);
  }
}

async function runWorkstream(workstream, context) {
  const workerDir = join(context.runDir, "workers", workstream.name);
  mkdirSync(workerDir, { recursive: true });

  const beforeFiles = new Set(getWorkingTreeFiles(context.cwd));
  const commandResults = [];
  const residualRisks = [];
  let status = "success";

  for (let index = 0; index < workstream.commands.length; index += 1) {
    if (context.interruptState.requested) {
      status = "interrupted";
      residualRisks.push("Interrupted before command execution completed.");
      break;
    }

    const command = workstream.commands[index];
    const commandId = String(index + 1).padStart(2, "0");
    const stdoutPath = join(workerDir, `command-${commandId}.stdout.log`);
    const stderrPath = join(workerDir, `command-${commandId}.stderr.log`);

    if (context.verbose) {
      console.log(
        `[orchestrator][${workstream.name}] command ${index + 1}/${workstream.commands.length} start: ${summarizeCommand(command)}`,
      );
      console.log(
        `[orchestrator][${workstream.name}] logs: stdout=${stdoutPath} stderr=${stderrPath}`,
      );
    }

    const commandResult = await runShellCommand(command, {
      cwd: context.cwd,
      stdoutPath,
      stderrPath,
    });

    commandResults.push(commandResult);

    if (context.verbose) {
      console.log(
        `[orchestrator][${workstream.name}] command ${index + 1}/${workstream.commands.length} done: exit=${commandResult.exit_code} duration=${commandResult.duration_ms}ms`,
      );
      printCommandTail(workstream.name, "stdout", commandResult.stdout_path, {
        tailLines: context.tailLines,
      });
      printCommandTail(workstream.name, "stderr", commandResult.stderr_path, {
        tailLines: context.tailLines,
      });
    }

    if (commandResult.exit_code !== 0) {
      status = "failure";
      residualRisks.push(`Command failed: ${command}`);
      break;
    }

    if (context.interruptState.requested) {
      status = "interrupted";
      residualRisks.push("Interrupted after command execution.");
      break;
    }
  }

  const afterFiles = new Set(getWorkingTreeFiles(context.cwd));
  const changedFiles = [...afterFiles].filter(
    (filePath) => !beforeFiles.has(filePath),
  );

  const scopeViolations = changedFiles.filter(
    (filePath) => !matchesAnyGlob(filePath, workstream.files_allowed ?? []),
  );

  if (scopeViolations.length > 0) {
    if (status !== "interrupted") {
      status = "failure";
    }
    residualRisks.push(
      `Workstream changed files outside files_allowed: ${scopeViolations.join(", ")}`,
    );
  }

  if (changedFiles.length === 0) {
    residualRisks.push(
      "No newly-detected changed files were produced by this worker.",
    );
  }

  const result = {
    task_id: context.taskId,
    workstream: workstream.name,
    worker: workstream.worker,
    status,
    started_at: new Date(
      Date.now() - sumDurations(commandResults),
    ).toISOString(),
    finished_at: new Date().toISOString(),
    files_allowed: workstream.files_allowed ?? [],
    changed_files: changedFiles,
    commands: commandResults,
    residual_risks: residualRisks,
  };

  writeJson(join(workerDir, "result.json"), result);
  console.log(`[orchestrator] ${workstream.name}: ${status}`);
  return result;
}

async function runMergeGate(task, workstreamResults, context) {
  const gate = task.merge_gate ?? {};
  const requiredWorkers =
    gate.required_workers ?? task.workstreams.map((item) => item.name);
  const failures = [];
  let interrupted = false;

  if (context.interruptState.requested) {
    failures.push("Run interrupted by SIGINT before merge gate checks.");
    interrupted = true;
  }

  for (const requiredWorkstream of requiredWorkers) {
    const result = workstreamResults.find(
      (item) => item.workstream === requiredWorkstream,
    );
    if (!result) {
      failures.push(
        `Missing required workstream result: ${requiredWorkstream}`,
      );
      continue;
    }

    if (result.status === "failure") {
      failures.push(`Required workstream failed: ${requiredWorkstream}`);
    }
  }

  const checks = normalizeChecks(task.checks_required ?? []);
  const checkResults = [];
  if (!interrupted) {
    for (const check of checks.valid) {
      if (context.interruptState.requested) {
        interrupted = true;
        failures.push("Run interrupted by SIGINT during merge gate checks.");
        break;
      }

      const command = CHECK_COMMANDS[check];
      const stdoutPath = join(context.runDir, `merge-gate-${check}.stdout.log`);
      const stderrPath = join(context.runDir, `merge-gate-${check}.stderr.log`);

      if (context.verbose) {
        console.log(`[orchestrator][merge-gate] running check: ${check}`);
      }

      const checkResult = await runShellCommand(command, {
        cwd: context.cwd,
        stdoutPath,
        stderrPath,
      });

      checkResults.push({
        check,
        ...checkResult,
      });

      if (context.verbose) {
        console.log(
          `[orchestrator][merge-gate] check ${check} done: exit=${checkResult.exit_code} duration=${checkResult.duration_ms}ms`,
        );
        printCommandTail("merge-gate", "stdout", checkResult.stdout_path, {
          tailLines: context.tailLines,
        });
        printCommandTail("merge-gate", "stderr", checkResult.stderr_path, {
          tailLines: context.tailLines,
        });
      }

      if (checkResult.exit_code !== 0) {
        failures.push(`Merge gate check failed: ${check}`);
      }
    }
  }

  const policyResults = interrupted
    ? { failures: [], details: [] }
    : runPolicyChecks(
        gate.policy ?? {},
        getWorkingTreeFiles(context.cwd),
        context.cwd,
      );
  failures.push(...policyResults.failures);

  const report = {
    required_workers: requiredWorkers,
    checks_run: checkResults,
    policy_results: policyResults,
    failures,
    status: interrupted
      ? "interrupted"
      : failures.length === 0
        ? "success"
        : "failure",
    finished_at: new Date().toISOString(),
  };

  writeJson(join(context.runDir, "merge-gate-report.json"), report);
  return report;
}

function runPolicyChecks(policy, changedFiles, cwd) {
  const failures = [];
  const details = [];

  if (policy.require_pr_template_sections) {
    const requiredSections = [
      "## Flow Impact",
      "## E2E Coverage Matrix",
      "## PR Acceptance Criteria (Required When No Linked Issue)",
      "## PR Happy Paths (Required When No Linked Issue)",
    ];

    const templatePath = resolve(cwd, ".github", "pull_request_template.md");
    const templateContent = readFileSync(templatePath, "utf8");
    const missingSections = requiredSections.filter(
      (section) => !templateContent.includes(section),
    );

    details.push({
      policy: "require_pr_template_sections",
      missing_sections: missingSections,
    });

    if (missingSections.length > 0) {
      failures.push(
        `PR template is missing required sections: ${missingSections.join(", ")}`,
      );
    }
  }

  if (policy.require_adr_for_architecture_changes) {
    const architecturePaths = [
      "src/app/",
      "src/server/",
      "src/lib/api/",
      "docs/app-architecture.md",
    ];

    const touchesArchitecture = changedFiles.some((filePath) =>
      architecturePaths.some((prefix) => filePath.startsWith(prefix)),
    );

    const touchesAdr = changedFiles.some((filePath) =>
      filePath.startsWith("docs/development/decisions/"),
    );

    details.push({
      policy: "require_adr_for_architecture_changes",
      touches_architecture: touchesArchitecture,
      touches_adr: touchesAdr,
    });

    if (touchesArchitecture && !touchesAdr) {
      failures.push(
        "Architecture-related changes detected without ADR change under docs/development/decisions/.",
      );
    }
  }

  return {
    failures,
    details,
  };
}

async function runWithConcurrency(items, concurrency, worker, shouldStop) {
  const effectiveConcurrency = Math.max(1, Number(concurrency) || 1);
  const queue = [...items];
  const results = [];
  const stopRequested =
    typeof shouldStop === "function" ? shouldStop : () => false;

  const runners = Array.from({
    length: Math.min(effectiveConcurrency, queue.length),
  }).map(async () => {
    while (queue.length > 0) {
      if (stopRequested()) {
        break;
      }

      const item = queue.shift();
      if (!item) {
        break;
      }

      const result = await worker(item);
      results.push(result);
    }
  });

  await Promise.all(runners);
  return results;
}

function parseJson(filePath) {
  const raw = readFileSync(filePath, "utf8");
  return JSON.parse(raw);
}

function writeJson(filePath, data) {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function parseArgs(argv) {
  const args = {
    help: false,
    taskPath: "",
    maxParallel: 1,
    allowDestructive: false,
    verbose: false,
    tailLines: 30,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];

    if (current === "--task") {
      args.taskPath = argv[index + 1] ?? "";
      index += 1;
      continue;
    }

    if (current === "--max-parallel") {
      args.maxParallel = Number(argv[index + 1] ?? "1");
      index += 1;
      continue;
    }

    if (current === "--allow-destructive") {
      args.allowDestructive = true;
      continue;
    }

    if (current === "--verbose") {
      args.verbose = true;
      continue;
    }

    if (current === "--tail-lines") {
      args.tailLines = normalizeTailLines(argv[index + 1], 30);
      index += 1;
      continue;
    }

    if (current === "--help" || current === "-h") {
      args.help = true;
      continue;
    }

    if (current.startsWith("-")) {
      fail(`Unknown argument: ${current}`);
    }
  }

  return args;
}

function resolveExecutionPolicy(task, args) {
  const taskPolicy = task.execution_policy ?? {};

  return {
    allow_destructive_commands:
      Boolean(taskPolicy.allow_destructive_commands) ||
      Boolean(args.allowDestructive),
    approval_policy: taskPolicy.approval_policy ?? "on-request",
    risk_tier: taskPolicy.risk_tier ?? "unknown",
    risk_reasons: Array.isArray(taskPolicy.risk_reasons)
      ? taskPolicy.risk_reasons
      : [],
  };
}

function printUsage() {
  console.log(
    `
Usage:
  yarn orchestrator:run --task path/to/task.json

Options:
  --task <path>            Task contract path
  --max-parallel <n>       Maximum parallel workstreams per stage
  --verbose                Show per-command progress and log tails
  --tail-lines <n>         Number of log tail lines per command (default: 30)
  --allow-destructive      Allow destructive commands in task contracts
  --help, -h               Show this help
`.trim(),
  );
}

function createSigintHandler(interruptState) {
  let signalCount = 0;

  return () => {
    signalCount += 1;

    if (signalCount > 1) {
      console.error(
        "[orchestrator] second interrupt received; exiting immediately.",
      );
      process.exit(130);
    }

    interruptState.requested = true;
    console.log(
      "[orchestrator] interrupt received (SIGINT). Finishing active command and writing partial summary...",
    );
  };
}

function printCommandTail(scope, streamName, filePath, options = {}) {
  const tailLines = normalizeTailLines(options.tailLines, 30);
  const lines = readLogTail(filePath, tailLines);

  if (lines.length === 0) {
    return;
  }

  console.log(
    `[orchestrator][${scope}] ${streamName} tail (${lines.length} line(s)):`,
  );
  for (const line of lines) {
    console.log(`  ${line}`);
  }
}

function sumDurations(commandResults) {
  return commandResults.reduce((sum, item) => sum + (item.duration_ms ?? 0), 0);
}

function fail(message) {
  console.error(`[orchestrator] ${message}`);
  process.exit(1);
}

await main();
