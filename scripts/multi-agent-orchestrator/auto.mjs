#!/usr/bin/env node

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { analyzePrompt } from "./lib/prompt-router.mjs";
import { sanitizeRunId } from "./lib/contract-utils.mjs";
import {
  assessPromptRisk,
  buildSafeAgentPrompt,
  normalizeApprovalPolicy,
} from "./lib/safety-utils.mjs";

const AUTO_PROFILES = new Set([
  "auto",
  "pr-review",
  "feature-delivery",
  "docs-maintenance",
]);

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printUsage();
    return;
  }

  if (!args.prompt) {
    fail(
      'Missing task prompt. Use --prompt "..." or pass a positional prompt.',
    );
  }

  if (!AUTO_PROFILES.has(args.profile)) {
    fail(
      `Unsupported --profile "${args.profile}". Allowed: ${[
        ...AUTO_PROFILES,
      ].join(", ")}.`,
    );
  }

  const analysis = analyzePrompt(args.prompt, {
    profile: args.profile,
    prNumber: args.pr,
  });
  const risk = assessPromptRisk(analysis);

  if (analysis.primaryProfile === "pr-review" && !analysis.prNumber) {
    fail(
      "PR review mode requires a PR number. Include it in prompt (e.g. 'review PR 48') or pass --pr 48.",
    );
  }

  if (risk.requiresExplicitConfirmation && !args.confirmRisky) {
    fail(
      [
        "High-risk prompt detected. Re-run with --confirm-risky if intentional.",
        `Reasons: ${risk.reasons.join("; ")}`,
      ].join("\n"),
    );
  }

  const task = buildTaskContract(analysis, args, risk);
  const contractPath = writeContract(task);

  console.log("[orchestrator:auto] profile:", analysis.primaryProfile);
  console.log(
    "[orchestrator:auto] required skills:",
    analysis.requiredSkills.join(", "),
  );
  console.log("[orchestrator:auto] contract:", contractPath);
  console.log("[orchestrator:auto] risk tier:", risk.tier);

  if (args.printAnalysis) {
    console.log("[orchestrator:auto] analysis:");
    console.log(JSON.stringify({ ...analysis, risk }, null, 2));
  }

  if (args.dryRun || args.noRun) {
    console.log(
      "[orchestrator:auto] dry run complete. Contract generated only.",
    );
    return;
  }

  const runResult = spawnSync(
    "node",
    [
      "scripts/multi-agent-orchestrator/supervisor.mjs",
      "--task",
      contractPath,
      "--max-parallel",
      String(args.maxParallel),
      ...(args.allowDestructive ? ["--allow-destructive"] : []),
    ],
    {
      stdio: "inherit",
    },
  );

  if (runResult.status !== 0) {
    process.exit(runResult.status ?? 1);
  }
}

function buildTaskContract(analysis, args, risk) {
  if (analysis.primaryProfile === "pr-review") {
    return buildPrReviewContract(analysis, args, risk);
  }

  if (analysis.primaryProfile === "docs-maintenance") {
    return buildDocsContract(analysis, args, risk);
  }

  return buildFeatureContract(analysis, args, risk);
}

function buildPrReviewContract(analysis, args, risk) {
  const pr = analysis.prNumber;
  const outputPrefix = `.orchestrator/output/pr-${pr}`;

  const workstreams = [
    {
      name: "pr-context",
      worker: "pnp-orchestrator",
      files_allowed: [".orchestrator/**"],
      commands: [
        "mkdir -p .orchestrator/input .orchestrator/output",
        `gh pr view ${pr} --json number,title,state,baseRefName,headRefName,author,body,statusCheckRollup > .orchestrator/input/pr-${pr}-meta.json`,
        `gh pr diff ${pr} > .orchestrator/input/pr-${pr}.diff`,
        ...(args.checkoutPr ? [`gh pr checkout ${pr}`] : []),
      ],
    },
    {
      name: "pr-review",
      worker: "pnp-pr-review",
      depends_on: ["pr-context"],
      files_allowed: [".orchestrator/**"],
      commands: [
        "mkdir -p .orchestrator/output",
        buildCodexExecCommand(
          [
            "Use pnp-pr-review as primary skill and pnp-orchestrator for coordination.",
            `Review PR #${pr}.`,
            "Use findings-first output ordered by severity.",
            "Focus on correctness, regressions, security boundaries, query invalidation, and missing tests.",
          ].join(" "),
          `${outputPrefix}-review.md`,
          args,
        ),
      ],
    },
    {
      name: "quality-gate",
      worker: "pnp-quality-gatekeeper",
      depends_on: ["pr-review"],
      files_allowed: [".orchestrator/**", "docs/**", "AGENTS.md", "README.md"],
      commands: [
        buildCodexExecCommand(
          [
            "Use pnp-quality-gatekeeper as primary skill.",
            `Validate PR review quality for PR #${pr}.`,
            "Produce a concise pass/fail quality report with required follow-ups for correctness, security, and performance.",
          ].join(" "),
          `${outputPrefix}-quality-gate.md`,
          args,
        ),
      ],
    },
    {
      name: "pr-readiness-check",
      worker: "pnp-pr-readiness",
      depends_on: ["quality-gate"],
      files_allowed: [".orchestrator/**"],
      commands: [
        "mkdir -p .orchestrator/output",
        `gh pr view ${pr} --json statusCheckRollup > ${outputPrefix}-status-checks.json`,
      ],
    },
  ];

  return {
    task_id: `AUTO-PR-REVIEW-${pr}`,
    title: `Auto PR review for PR #${pr}`,
    checks_required: [],
    execution_policy: buildExecutionPolicy(args, risk),
    workstreams,
    merge_gate: {
      required_workers: workstreams.map((item) => item.name),
      policy: {
        require_pr_template_sections: false,
        require_adr_for_architecture_changes: false,
      },
    },
  };
}

function buildFeatureContract(analysis, args, risk) {
  const workstreams = [
    {
      name: "planning",
      worker: "pnp-orchestrator",
      files_allowed: [".orchestrator/**"],
      commands: [
        "mkdir -p .orchestrator/output",
        buildCodexExecCommand(
          [
            "Use pnp-orchestrator as lead.",
            "Route to pnp-feature-delivery and other specialized skills where needed.",
            `Task request: ${analysis.prompt}`,
            "First produce a concise implementation plan.",
            analysis.signal.asksIssue
              ? "Create or update GitHub issue(s) when useful and include links in the final output."
              : "Do not create GitHub issues unless necessary.",
          ].join(" "),
          ".orchestrator/output/feature-plan.md",
          args,
        ),
      ],
    },
    {
      name: "implementation",
      worker: "pnp-feature-delivery",
      depends_on: ["planning"],
      files_allowed: [
        "src/**",
        "tests/**",
        "docs/**",
        ".github/**",
        "supabase/**",
        "scripts/**",
        "README.md",
        "AGENTS.md",
      ],
      commands: [
        buildCodexExecCommand(
          [
            "Use pnp-feature-delivery as primary skill.",
            `Implement the requested feature: ${analysis.prompt}`,
            "Follow AGENTS.md architecture/security/testing rules.",
            "Run and pass required quality gates for changed scope.",
          ].join(" "),
          ".orchestrator/output/feature-implementation.md",
          args,
        ),
      ],
    },
    {
      name: "quality-gate",
      worker: "pnp-quality-gatekeeper",
      depends_on: ["implementation"],
      files_allowed: [
        "src/**",
        "tests/**",
        "docs/**",
        ".github/**",
        "supabase/**",
        "scripts/**",
        "README.md",
        "AGENTS.md",
        ".orchestrator/**",
      ],
      commands: [
        buildCodexExecCommand(
          [
            "Use pnp-quality-gatekeeper as primary skill.",
            `Validate implementation quality for task: ${analysis.prompt}`,
            "Return pass/fail plus concrete required follow-ups for correctness, security, performance, and test adequacy.",
          ].join(" "),
          ".orchestrator/output/feature-quality-gate.md",
          args,
        ),
      ],
    },
    {
      name: "pr-readiness",
      worker: "pnp-pr-readiness",
      depends_on: ["quality-gate"],
      files_allowed: [
        ".github/**",
        "docs/**",
        ".orchestrator/**",
        "AGENTS.md",
        "README.md",
      ],
      commands: [
        buildCodexExecCommand(
          [
            "Use pnp-pr-readiness as primary skill.",
            "Prepare branch for PR readiness and summarize outstanding risks.",
            "Ensure PR template fields and docs/ADR expectations are satisfied.",
          ].join(" "),
          ".orchestrator/output/pr-readiness.md",
          args,
        ),
      ],
    },
  ];

  const needsAdr = analysis.signal.asksArchitectureLevelChange;

  return {
    task_id: `AUTO-FEATURE-${sanitizeRunId(analysis.prompt).slice(0, 36)}`,
    title: `Auto feature delivery: ${analysis.prompt.slice(0, 80)}`,
    checks_required: ["typecheck", "lint", "test:run", "build"],
    execution_policy: buildExecutionPolicy(args, risk),
    workstreams,
    merge_gate: {
      required_workers: workstreams.map((item) => item.name),
      policy: {
        require_pr_template_sections: true,
        require_adr_for_architecture_changes: needsAdr,
      },
    },
  };
}

function buildDocsContract(analysis, args, risk) {
  const workstreams = [
    {
      name: "docs-maintenance",
      worker: "pnp-docs-maintainer",
      files_allowed: ["README.md", "docs/**", "AGENTS.md", ".orchestrator/**"],
      commands: [
        "mkdir -p .orchestrator/output",
        buildCodexExecCommand(
          [
            "Use pnp-docs-maintainer as primary skill.",
            `Apply documentation changes requested: ${analysis.prompt}`,
            "Keep docs link-first and avoid duplication.",
          ].join(" "),
          ".orchestrator/output/docs-maintenance.md",
          args,
        ),
      ],
    },
    {
      name: "quality-gate",
      worker: "pnp-quality-gatekeeper",
      depends_on: ["docs-maintenance"],
      files_allowed: [
        "README.md",
        "docs/**",
        "AGENTS.md",
        ".github/**",
        ".orchestrator/**",
      ],
      commands: [
        buildCodexExecCommand(
          [
            "Use pnp-quality-gatekeeper as primary skill.",
            `Validate docs quality for task: ${analysis.prompt}`,
            "Check clarity, deduplication, and safety consistency. Return pass/fail with required follow-ups.",
          ].join(" "),
          ".orchestrator/output/docs-quality-gate.md",
          args,
        ),
      ],
    },
    {
      name: "pr-readiness",
      worker: "pnp-pr-readiness",
      depends_on: ["quality-gate"],
      files_allowed: [
        "README.md",
        "docs/**",
        ".github/**",
        "AGENTS.md",
        ".orchestrator/**",
      ],
      commands: [
        buildCodexExecCommand(
          "Use pnp-pr-readiness and verify docs-only PR completeness.",
          ".orchestrator/output/docs-pr-readiness.md",
          args,
        ),
      ],
    },
  ];

  return {
    task_id: `AUTO-DOCS-${sanitizeRunId(analysis.prompt).slice(0, 36)}`,
    title: `Auto docs maintenance: ${analysis.prompt.slice(0, 80)}`,
    checks_required: ["lint"],
    execution_policy: buildExecutionPolicy(args, risk),
    workstreams,
    merge_gate: {
      required_workers: workstreams.map((item) => item.name),
      policy: {
        require_pr_template_sections: false,
        require_adr_for_architecture_changes: false,
      },
    },
  };
}

function buildCodexExecCommand(prompt, outputFile, args) {
  const safePrompt = buildSafeAgentPrompt(prompt);

  return [
    "codex",
    `-a ${args.approvalPolicy}`,
    "exec",
    "--sandbox workspace-write",
    `--output-last-message ${shellQuote(outputFile)}`,
    shellQuote(safePrompt),
  ].join(" ");
}

function buildExecutionPolicy(args, risk) {
  return {
    allow_destructive_commands: Boolean(args.allowDestructive),
    approval_policy: args.approvalPolicy,
    risk_tier: risk.tier,
    risk_reasons: risk.reasons,
  };
}

function writeContract(contract) {
  const stamp = `${Date.now()}-${sanitizeRunId(contract.task_id)}`;
  const outputPath = resolve(
    process.cwd(),
    ".orchestrator",
    "contracts",
    `${stamp}.json`,
  );

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(contract, null, 2)}\n`, "utf8");
  return outputPath;
}

function shellQuote(value) {
  return `'${String(value).replaceAll("'", `'"'"'`)}'`;
}

function parseArgs(argv) {
  const args = {
    help: false,
    prompt: "",
    profile: "auto",
    pr: null,
    dryRun: false,
    noRun: false,
    printAnalysis: false,
    maxParallel: 1,
    checkoutPr: false,
    allowDestructive: false,
    confirmRisky: false,
    approvalPolicy: "on-request",
  };
  const positional = [];

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];

    if (current === "--help" || current === "-h") {
      args.help = true;
      continue;
    }

    if (current === "--prompt") {
      args.prompt = argv[index + 1] ?? "";
      index += 1;
      continue;
    }

    if (current === "--profile") {
      args.profile = argv[index + 1] ?? "auto";
      index += 1;
      continue;
    }

    if (current === "--pr") {
      const value = Number(argv[index + 1]);
      args.pr = Number.isFinite(value) ? value : null;
      index += 1;
      continue;
    }

    if (current === "--max-parallel") {
      const value = Number(argv[index + 1]);
      args.maxParallel = Number.isFinite(value) && value > 0 ? value : 1;
      index += 1;
      continue;
    }

    if (current === "--dry-run") {
      args.dryRun = true;
      continue;
    }

    if (current === "--no-run") {
      args.noRun = true;
      continue;
    }

    if (current === "--print-analysis") {
      args.printAnalysis = true;
      continue;
    }

    if (current === "--no-checkout-pr") {
      args.checkoutPr = false;
      continue;
    }

    if (current === "--checkout-pr") {
      args.checkoutPr = true;
      continue;
    }

    if (current === "--allow-destructive") {
      args.allowDestructive = true;
      continue;
    }

    if (current === "--confirm-risky") {
      args.confirmRisky = true;
      continue;
    }

    if (current === "--approval-policy") {
      args.approvalPolicy = argv[index + 1] ?? "on-request";
      index += 1;
      continue;
    }

    if (current.startsWith("-")) {
      fail(`Unknown argument: ${current}`);
    }

    positional.push(current);
  }

  if (!args.prompt && positional.length > 0) {
    args.prompt = positional.join(" ");
  }

  try {
    args.approvalPolicy = normalizeApprovalPolicy(args.approvalPolicy);
  } catch (error) {
    fail(error instanceof Error ? error.message : "Invalid approval policy.");
  }

  return args;
}

function printUsage() {
  console.log(
    `
Usage:
  yarn orchestrator:auto --prompt "review PR 48"
  yarn orchestrator:auto --prompt "build feature x with issue + plan"

Options:
  --prompt "<text>"         Task prompt. If omitted, positional args are joined.
  --profile <name>          auto | pr-review | feature-delivery | docs-maintenance
  --pr <number>             Force PR number (mainly for pr-review profile)
  --max-parallel <number>   Max concurrent workstreams per execution stage
  --print-analysis          Print detected routing analysis
  --dry-run                 Generate contract only, do not execute
  --no-run                  Alias for --dry-run
  --approval-policy <name>  untrusted | on-failure | on-request | never (default: on-request)
  --confirm-risky           Explicitly confirm high-risk prompts (destructive/secrets)
  --allow-destructive       Allow destructive commands in contract execution policy
  --checkout-pr             Checkout PR branch in pr-review profile
  --no-checkout-pr          Do not checkout PR branch (default)
  --help, -h                Show this help
`.trim(),
  );
}

function fail(message) {
  console.error(`[orchestrator:auto] ${message}`);
  process.exit(1);
}

main();
