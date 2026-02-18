import { execSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const REQUIRED_HEADINGS = {
  linkedIssues: "Linked Issue(s)",
  flowImpact: "Flow Impact",
  coverageMatrix: "E2E Coverage Matrix",
  noIssueAcceptanceCriteria:
    "PR Acceptance Criteria (Required When No Linked Issue)",
  noIssueHappyPaths: "PR Happy Paths (Required When No Linked Issue)",
};

const FLOW_IMPACT_CHECKBOXES = {
  noImpact: "No user-flow impact",
  existingFlow: "Existing flow changed",
  newFlow: "New flow added",
};

const FLOW_IMPACT_PATH_PATTERNS = [
  /^src\/app\/.+\/page\.tsx$/,
  /^src\/page-modules\//,
  /^src\/components\//,
  /^src\/app\/api\//,
  /^src\/features\/.+\/queries\//,
  /^src\/features\/.+\/hooks\//,
];

const SCENARIO_ID_PATTERN = /\bFLOW-[a-z0-9]+-[a-z0-9-]+\b/gi;

function sectionize(markdown) {
  const sections = new Map();
  const lines = markdown.split("\n");
  let currentHeading = null;
  let buffer = [];

  for (const line of lines) {
    const headingMatch = line.match(/^##\s+(.+?)\s*$/);
    if (headingMatch) {
      if (currentHeading) {
        sections.set(currentHeading, buffer.join("\n").trim());
      }
      currentHeading = headingMatch[1].trim();
      buffer = [];
      continue;
    }

    if (currentHeading) {
      buffer.push(line);
    }
  }

  if (currentHeading) {
    sections.set(currentHeading, buffer.join("\n").trim());
  }

  return sections;
}

function getChangedFiles(baseRef) {
  const diffRange = baseRef ? `origin/${baseRef}...HEAD` : "HEAD~1...HEAD";
  const output = execSync(
    `git diff --name-only --diff-filter=ACMRTUXB ${diffRange}`,
    {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  return output
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function isChecked(markdown, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`^-\\s*\\[x\\]\\s*${escaped}\\s*$`, "im");
  return pattern.test(markdown);
}

function hasMeaningfulContent(sectionContent) {
  if (!sectionContent) {
    return false;
  }

  const ignoredValues = new Set(["...", "n/a", "na", "none", "tbd"]);

  const lines = sectionContent
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    if (line.startsWith("|")) {
      continue;
    }

    const normalized = line
      .replace(/^[-*]\s*/, "")
      .replace(/[`*_#>|]/g, "")
      .trim()
      .toLowerCase();

    if (!normalized) {
      continue;
    }

    if (ignoredValues.has(normalized)) {
      continue;
    }

    if (/[a-z0-9]/i.test(normalized)) {
      return true;
    }
  }

  return false;
}

function getE2ESpecFiles(rootDirectory) {
  const result = [];

  if (!statSafe(rootDirectory)?.isDirectory()) {
    return result;
  }

  const queue = [rootDirectory];
  while (queue.length > 0) {
    const current = queue.pop();
    if (!current) {
      continue;
    }

    for (const entry of readdirSync(current)) {
      const fullPath = join(current, entry);
      const info = statSafe(fullPath);
      if (!info) {
        continue;
      }

      if (info.isDirectory()) {
        queue.push(fullPath);
        continue;
      }

      if (/\.(spec|test)\.(ts|tsx|js|jsx|mjs|cjs)$/.test(entry)) {
        result.push(fullPath);
      }
    }
  }

  return result;
}

function statSafe(path) {
  try {
    return statSync(path);
  } catch {
    return null;
  }
}

function extractScenarioIds(text) {
  const matches = text.match(SCENARIO_ID_PATTERN) ?? [];
  return [...new Set(matches.map((match) => match.toUpperCase()))];
}

function fail(errors) {
  for (const error of errors) {
    console.error(`::error::${error}`);
  }
  process.exit(1);
}

function main() {
  const baseRef = process.env.BASE_REF;
  const prBody = process.env.PR_BODY ?? "";
  const sections = sectionize(prBody);
  const changedFiles = getChangedFiles(baseRef);
  const isFlowImpacting = changedFiles.some((filePath) =>
    FLOW_IMPACT_PATH_PATTERNS.some((pattern) => pattern.test(filePath)),
  );

  if (!isFlowImpacting) {
    console.log("E2E policy: no flow-impacting file changes detected.");
    return;
  }

  const errors = [];
  const linkedIssuesSection =
    sections.get(REQUIRED_HEADINGS.linkedIssues) ?? "";
  const flowImpactSection = sections.get(REQUIRED_HEADINGS.flowImpact) ?? "";
  const matrixSection = sections.get(REQUIRED_HEADINGS.coverageMatrix) ?? "";
  const noIssueAcceptanceCriteriaSection =
    sections.get(REQUIRED_HEADINGS.noIssueAcceptanceCriteria) ?? "";
  const noIssueHappyPathsSection =
    sections.get(REQUIRED_HEADINGS.noIssueHappyPaths) ?? "";

  const hasLinkedIssue =
    /#\d+/.test(linkedIssuesSection) ||
    /https:\/\/github\.com\/[^/\s]+\/[^/\s]+\/issues\/\d+/i.test(
      linkedIssuesSection,
    );

  const flowNoImpactChecked = isChecked(
    flowImpactSection,
    FLOW_IMPACT_CHECKBOXES.noImpact,
  );
  const flowExistingChangedChecked = isChecked(
    flowImpactSection,
    FLOW_IMPACT_CHECKBOXES.existingFlow,
  );
  const flowNewFlowChecked = isChecked(
    flowImpactSection,
    FLOW_IMPACT_CHECKBOXES.newFlow,
  );

  if (flowNoImpactChecked) {
    errors.push(
      "Flow impact is marked as 'No user-flow impact', but flow-impacting files were changed.",
    );
  }

  if (!flowExistingChangedChecked && !flowNewFlowChecked) {
    errors.push(
      "For flow-impacting PRs, select 'Existing flow changed' or 'New flow added' in the Flow Impact section.",
    );
  }

  const scenarioIds = extractScenarioIds(matrixSection);
  if (scenarioIds.length === 0) {
    errors.push(
      "E2E Coverage Matrix must contain at least one scenario ID in format FLOW-<domain>-<slug>.",
    );
  }

  const changedE2EFiles = changedFiles.some((filePath) =>
    filePath.startsWith("tests/e2e/"),
  );
  const reusesExistingScenarios = /\bexisting\b/i.test(matrixSection);
  if (!changedE2EFiles && !reusesExistingScenarios) {
    errors.push(
      "Flow-impacting PRs must either update tests under tests/e2e/ or explicitly mark scenario reuse as 'Existing' in the E2E Coverage Matrix.",
    );
  }

  if (!hasLinkedIssue) {
    if (!hasMeaningfulContent(noIssueAcceptanceCriteriaSection)) {
      errors.push(
        "No linked issue detected. Fill 'PR Acceptance Criteria (Required When No Linked Issue)'.",
      );
    }

    if (!hasMeaningfulContent(noIssueHappyPathsSection)) {
      errors.push(
        "No linked issue detected. Fill 'PR Happy Paths (Required When No Linked Issue)'.",
      );
    }
  }

  if (scenarioIds.length > 0) {
    const e2eSpecs = getE2ESpecFiles("tests/e2e");
    const e2eContents = e2eSpecs.map((file) => readFileSync(file, "utf8"));
    const missingScenarioIds = scenarioIds.filter(
      (id) => !e2eContents.some((content) => content.includes(id)),
    );

    if (missingScenarioIds.length > 0) {
      errors.push(
        `Scenario IDs referenced in E2E Coverage Matrix are not present in tests/e2e specs: ${missingScenarioIds.join(
          ", ",
        )}`,
      );
    }
  }

  if (errors.length > 0) {
    fail(errors);
  }

  console.log(
    `E2E policy passed for flow-impacting PR. Changed files: ${changedFiles.length}, scenarios: ${scenarioIds.length}.`,
  );
}

main();
