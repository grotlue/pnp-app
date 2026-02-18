import { appendFileSync } from "node:fs";
import { execSync } from "node:child_process";
import {
  KNOWN_TARGETS,
  PUBLIC_ROUTES,
  buildExpectedFilesMarkdown,
  detectKnownTargets,
  findUnmappedFiles,
  inferExtraRoutes,
  markdownList,
} from "../../scripts/pr-screenshot-targets.config.mjs";

function run(command) {
  return execSync(command, { encoding: "utf8", stdio: "pipe" }).trim();
}

function readChangedFiles(baseRef) {
  try {
    return run(
      `git diff --name-only --diff-filter=ACMRTUXB "origin/${baseRef}"...HEAD`,
    );
  } catch {
    return run(
      `git diff --name-only --diff-filter=ACMRTUXB "origin/${baseRef}"..HEAD`,
    );
  }
}

function writeOutput(name, value) {
  const githubOutput = process.env.GITHUB_OUTPUT;
  if (!githubOutput) {
    console.log(`${name}=${value}`);
    return;
  }

  appendFileSync(githubOutput, `${name}<<__EOF__\n${value}\n__EOF__\n`);
}

const baseRef = process.env.BASE_REF;
if (!baseRef) {
  throw new Error("BASE_REF is required.");
}

const changedFilesRaw = readChangedFiles(baseRef);
const changedFiles = changedFilesRaw
  .split("\n")
  .map((file) => file.trim())
  .filter((file) => file.length > 0);

const knownTargets = detectKnownTargets(changedFiles).sort((a, b) =>
  a.localeCompare(b),
);
const extraRoutes = inferExtraRoutes(changedFiles);
const knownTargetRoutes = new Set(
  KNOWN_TARGETS.filter((target) => knownTargets.includes(target.id)).map(
    (target) => target.route,
  ),
);
const filteredExtraRoutes = extraRoutes.filter(
  (route) => !knownTargetRoutes.has(route),
);

const hasTargets = knownTargets.length > 0 || filteredExtraRoutes.length > 0;
const unmappedFiles = findUnmappedFiles(changedFiles).sort((a, b) =>
  a.localeCompare(b),
);
const hasUnmappedFiles = unmappedFiles.length > 0;

const expectedFilesMarkdown = buildExpectedFilesMarkdown(
  knownTargets,
  filteredExtraRoutes,
);
const changedFilesMarkdown = markdownList(
  changedFiles,
  (file) => `\`${file}\``,
);
const selectedTargetsMarkdown = markdownList(
  knownTargets,
  (target) => `\`${target}\``,
);
const extraRoutesMarkdown = markdownList(filteredExtraRoutes, (route) => {
  const visibility = PUBLIC_ROUTES.has(route) ? "public" : "auth";
  return `\`${route}\` (${visibility})`;
});
const unmappedFilesMarkdown = markdownList(
  unmappedFiles,
  (file) => `\`${file}\``,
);

writeOutput("has_targets", String(hasTargets));
writeOutput("targets_csv", knownTargets.join(","));
writeOutput("extra_routes_csv", filteredExtraRoutes.join(","));
writeOutput("expected_files_markdown", expectedFilesMarkdown);
writeOutput("selected_targets_markdown", selectedTargetsMarkdown);
writeOutput("extra_routes_markdown", extraRoutesMarkdown);
writeOutput("changed_files_markdown", changedFilesMarkdown);
writeOutput("has_unmapped_files", String(hasUnmappedFiles));
writeOutput("unmapped_files_markdown", unmappedFilesMarkdown);
