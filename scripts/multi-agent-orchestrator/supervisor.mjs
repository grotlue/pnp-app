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

async function main() {
  const args = parseArgs(process.argv.slice(2));
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
  };
  writeJson(join(runDir, "run-meta.json"), runMeta);

  const workstreamMap = new Map(
    task.workstreams.map((item) => [item.name, item]),
  );
  const stages = resolveExecutionStages(task.workstreams);
  const workstreamResults = [];

  if (args.maxParallel > 1) {
    console.log(
      "[orchestrator] max_parallel > 1 uses same working tree. Prefer isolated worktrees for true parallel workers.",
    );
  }

  for (const stage of stages) {
    const stageWorkstreams = stage.map((name) => workstreamMap.get(name));

    const stageResults = await runWithConcurrency(
      stageWorkstreams,
      args.maxParallel,
      async (workstream) =>
        runWorkstream(workstream, { cwd, runDir, taskId: task.task_id }),
    );

    workstreamResults.push(...stageResults);

    const hasFailure = stageResults.some(
      (result) => result.status !== "success",
    );
    if (hasFailure) {
      console.log("[orchestrator] stage failed; stopping remaining stages.");
      break;
    }
  }

  const mergeGate = await runMergeGate(task, workstreamResults, {
    cwd,
    runDir,
  });

  const summary = {
    task_id: task.task_id,
    run_id: runId,
    started_at: runMeta.started_at,
    finished_at: new Date().toISOString(),
    workstream_results: workstreamResults,
    merge_gate: mergeGate,
    status: mergeGate.status,
  };

  writeJson(join(runDir, "run-summary.json"), summary);
  console.log(
    `[orchestrator] summary written to ${join(runDir, "run-summary.json")}`,
  );

  if (summary.status !== "success") {
    process.exit(1);
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
    const command = workstream.commands[index];
    const commandId = String(index + 1).padStart(2, "0");
    const commandResult = await runShellCommand(command, {
      cwd: context.cwd,
      stdoutPath: join(workerDir, `command-${commandId}.stdout.log`),
      stderrPath: join(workerDir, `command-${commandId}.stderr.log`),
    });

    commandResults.push(commandResult);

    if (commandResult.exit_code !== 0) {
      status = "failure";
      residualRisks.push(`Command failed: ${command}`);
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
    status = "failure";
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

    if (result.status !== "success") {
      failures.push(`Required workstream failed: ${requiredWorkstream}`);
    }
  }

  const checks = normalizeChecks(task.checks_required ?? []);
  const checkResults = [];
  for (const check of checks.valid) {
    const command = CHECK_COMMANDS[check];
    const checkResult = await runShellCommand(command, {
      cwd: context.cwd,
      stdoutPath: join(context.runDir, `merge-gate-${check}.stdout.log`),
      stderrPath: join(context.runDir, `merge-gate-${check}.stderr.log`),
    });

    checkResults.push({
      check,
      ...checkResult,
    });

    if (checkResult.exit_code !== 0) {
      failures.push(`Merge gate check failed: ${check}`);
    }
  }

  const policyResults = runPolicyChecks(
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
    status: failures.length === 0 ? "success" : "failure",
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

async function runWithConcurrency(items, concurrency, worker) {
  const effectiveConcurrency = Math.max(1, Number(concurrency) || 1);
  const queue = [...items];
  const results = [];

  const runners = Array.from({
    length: Math.min(effectiveConcurrency, queue.length),
  }).map(async () => {
    while (queue.length > 0) {
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
    taskPath: "",
    maxParallel: 1,
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
    }
  }

  return args;
}

function sumDurations(commandResults) {
  return commandResults.reduce((sum, item) => sum + (item.duration_ms ?? 0), 0);
}

function fail(message) {
  console.error(`[orchestrator] ${message}`);
  process.exit(1);
}

await main();
