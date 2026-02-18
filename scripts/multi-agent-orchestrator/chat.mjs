#!/usr/bin/env node

import { spawnSync } from "node:child_process";

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printUsage();
    return;
  }

  const prompt = buildBootstrapPrompt(args.mode, args.prompt);

  const codexArgs = [];
  if (args.mode === "plan") {
    codexArgs.push("--search");
  }
  codexArgs.push(prompt);

  const result = spawnSync("codex", codexArgs, {
    stdio: "inherit",
  });

  process.exit(result.status ?? 1);
}

function buildBootstrapPrompt(mode, userPrompt) {
  const lead =
    mode === "plan"
      ? [
          "Use pnp-orchestrator as lead skill.",
          "Start in planning conversation mode.",
          "Ask clarifying questions where needed.",
          "Do not execute file edits or mutating commands until the user explicitly confirms execution.",
          "Route conceptually to pnp-feature-delivery, pnp-db-migration-guardrails, pnp-pr-review, pnp-pr-readiness, and pnp-docs-maintainer when relevant.",
        ].join(" ")
      : [
          "Use pnp-orchestrator as lead skill.",
          "Route to specialized project skills when relevant.",
          "Keep outputs actionable and execution-oriented.",
        ].join(" ");

  if (!userPrompt) {
    return lead;
  }

  return `${lead}\n\nUser task:\n${userPrompt}`;
}

function parseArgs(argv) {
  const args = {
    help: false,
    mode: "default",
    prompt: "",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];

    if (current === "--help" || current === "-h") {
      args.help = true;
      continue;
    }

    if (current === "--mode") {
      const value = argv[index + 1] ?? "default";
      args.mode = value === "plan" ? "plan" : "default";
      index += 1;
      continue;
    }

    if (current === "--prompt") {
      args.prompt = argv[index + 1] ?? "";
      index += 1;
      continue;
    }
  }

  return args;
}

function printUsage() {
  console.log(
    `
Usage:
  yarn orchestrator:chat
  yarn orchestrator:plan --prompt "Plan feature xy"
  node scripts/multi-agent-orchestrator/chat.mjs --mode default --prompt "review PR 48"

Options:
  --mode <default|plan>   default: execution-oriented routing, plan: planning conversation first
  --prompt "<text>"       Optional initial user task
  --help, -h              Show this help
`.trim(),
  );
}

main();
