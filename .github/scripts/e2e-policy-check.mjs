import { execSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

export const REQUIRED_HEADINGS = {
  linkedIssues: "Linked Issue(s)",
  flowImpact: "Flow Impact",
  coverageMatrix: "E2E Coverage Matrix",
  noIssueAcceptanceCriteria:
    "PR Acceptance Criteria (Required When No Linked Issue)",
  noIssueHappyPaths: "PR Happy Paths (Required When No Linked Issue)",
};

export const FLOW_IMPACT_CHECKBOXES = {
  noImpact: "No user-flow impact",
  existingFlow: "Existing flow changed",
  newFlow: "New flow added",
};

export const FLOW_IMPACT_PATH_PATTERNS = [
  /^src\/app\/.+\/page\.tsx$/,
  /^src\/page-modules\//,
  /^src\/components\//,
  /^src\/app\/api\//,
  /^src\/features\/.+\/queries\//,
  /^src\/features\/.+\/hooks\//,
];

const SCENARIO_ID_PATTERN = /\bFLOW-[a-z0-9]+-[a-z0-9-]+\b/gi;
const TABLE_SEPARATOR_PATTERN = /^:?-{3,}:?$/;

export function sectionize(markdown) {
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

export function isChecked(markdown, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`^-\\s*\\[x\\]\\s*${escaped}\\s*$`, "im");
  return pattern.test(markdown);
}

export function hasMeaningfulContent(sectionContent) {
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

export function extractScenarioIds(text) {
  const matches = text.match(SCENARIO_ID_PATTERN) ?? [];
  return [...new Set(matches.map((match) => match.toUpperCase()))];
}

function splitTableCells(line) {
  return line
    .trim()
    .split("|")
    .map((cell) => cell.trim())
    .filter((cell, index, all) => {
      if (index === 0 && cell === "") {
        return false;
      }
      if (index === all.length - 1 && cell === "") {
        return false;
      }
      return true;
    });
}

function isSeparatorRow(cells) {
  return (
    cells.length > 0 &&
    cells.every((cell) => TABLE_SEPARATOR_PATTERN.test(cell))
  );
}

function normalizeCell(cell) {
  return cell
    .replace(/[`*_]/g, "")
    .replace(/<br\s*\/?\s*>/gi, " ")
    .trim();
}

function isMeaningfulFlowReference(ref) {
  if (!ref) {
    return false;
  }

  const normalized = normalizeCell(ref).toLowerCase();
  if (!normalized) {
    return false;
  }

  if (["...", "n/a", "na", "none", "tbd"].includes(normalized)) {
    return false;
  }

  if (/^ac[-\s]*\d*$/i.test(normalized)) {
    return false;
  }

  if (/^flow[-\s]*\d*$/i.test(normalized)) {
    return false;
  }

  if (/^user\s*flow[-\s]*\d*$/i.test(normalized)) {
    return false;
  }

  return /[a-z0-9]/i.test(normalized);
}

function parseCoverageRows(matrixSection) {
  const lines = matrixSection
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("|"));

  const rows = [];
  for (const line of lines) {
    const cells = splitTableCells(line);
    if (cells.length < 3 || isSeparatorRow(cells)) {
      continue;
    }

    rows.push({
      flowRef: normalizeCell(cells[0] ?? ""),
      scenarioIds: extractScenarioIds(cells[1] ?? ""),
      testStatus: normalizeCell(cells[2] ?? ""),
    });
  }

  return rows;
}

function parseStatuses(rows) {
  return rows
    .map((row) => row.testStatus.toLowerCase())
    .filter(Boolean)
    .flatMap((statusCell) =>
      statusCell
        .split(/[\/,|]/)
        .map((part) => part.trim())
        .filter(Boolean),
    );
}

function hasLinkedIssueReference(linkedIssuesSection) {
  return (
    /#\d+/.test(linkedIssuesSection) ||
    /https:\/\/github\.com\/[^/\s]+\/[^/\s]+\/issues\/\d+/i.test(
      linkedIssuesSection,
    )
  );
}

function fail(errors) {
  for (const error of errors) {
    console.error(`::error::${error}`);
  }
  process.exit(1);
}

export function evaluateE2EPolicy({
  prBody,
  changedFiles,
  availableScenarioIds,
}) {
  const sections = sectionize(prBody);
  const isFlowImpacting = changedFiles.some((filePath) =>
    FLOW_IMPACT_PATH_PATTERNS.some((pattern) => pattern.test(filePath)),
  );

  if (!isFlowImpacting) {
    return {
      errors: [],
      skipped: true,
      message: "E2E policy: no flow-impacting file changes detected.",
      scenarioCount: 0,
      changedFileCount: changedFiles.length,
    };
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

  const hasLinkedIssue = hasLinkedIssueReference(linkedIssuesSection);

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

  const matrixRows = parseCoverageRows(matrixSection);
  const scenarioRows = matrixRows.filter((row) => row.scenarioIds.length > 0);
  const scenarioIds = [
    ...new Set(scenarioRows.flatMap((row) => row.scenarioIds)),
  ];
  if (scenarioIds.length === 0) {
    errors.push(
      "E2E Coverage Matrix must contain at least one scenario ID in format FLOW-<domain>-<slug>.",
    );
  }

  if (hasLinkedIssue && scenarioRows.length > 0) {
    const missingFlowRefs = scenarioRows.filter(
      (row) => !isMeaningfulFlowReference(row.flowRef),
    );
    if (missingFlowRefs.length > 0) {
      errors.push(
        "Linked Issue PRs must map each scenario to a concrete AC/User Flow reference in 'E2E Coverage Matrix' column 'AC / User Flow Ref'.",
      );
    }
  }

  const changedE2EFiles = changedFiles.some((filePath) =>
    filePath.startsWith("tests/e2e/"),
  );
  const matrixStatuses = parseStatuses(matrixRows);
  const marksExisting = matrixStatuses.some((status) => status === "existing");
  const marksNewOrUpdated = matrixStatuses.some(
    (status) => status === "new" || status === "updated",
  );

  if (!hasLinkedIssue) {
    if (!marksNewOrUpdated) {
      errors.push(
        "No linked issue detected. At least one scenario in 'E2E Coverage Matrix' must be marked as 'New' or 'Updated' (only 'Existing' is not allowed).",
      );
    }

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

  if (!changedE2EFiles && !marksExisting) {
    errors.push(
      "Flow-impacting PRs must either update tests under tests/e2e/ or explicitly mark scenario reuse as 'Existing' in the E2E Coverage Matrix.",
    );
  }

  if (scenarioIds.length > 0) {
    const missingScenarioIds = scenarioIds.filter(
      (id) => !availableScenarioIds.has(id),
    );

    if (missingScenarioIds.length > 0) {
      errors.push(
        `Scenario IDs referenced in E2E Coverage Matrix are not present in tests/e2e specs: ${missingScenarioIds.join(
          ", ",
        )}`,
      );
    }
  }

  return {
    errors,
    skipped: false,
    message: `E2E policy passed for flow-impacting PR. Changed files: ${changedFiles.length}, scenarios: ${scenarioIds.length}.`,
    scenarioCount: scenarioIds.length,
    changedFileCount: changedFiles.length,
  };
}

function getScenarioIdsFromSpecs() {
  const e2eSpecs = getE2ESpecFiles("tests/e2e");
  const e2eContents = e2eSpecs.map((file) => readFileSync(file, "utf8"));
  return new Set(e2eContents.flatMap((content) => extractScenarioIds(content)));
}

export function runPolicyCheck({ baseRef, prBody }) {
  const changedFiles = getChangedFiles(baseRef);
  const availableScenarioIds = getScenarioIdsFromSpecs();

  return evaluateE2EPolicy({
    prBody,
    changedFiles,
    availableScenarioIds,
  });
}

function isDirectRun() {
  const entryFile = process.argv[1];
  if (!entryFile) {
    return false;
  }

  return pathToFileURL(entryFile).href === import.meta.url;
}

if (isDirectRun()) {
  const result = runPolicyCheck({
    baseRef: process.env.BASE_REF,
    prBody: process.env.PR_BODY ?? "",
  });

  if (result.skipped) {
    console.log(result.message);
    process.exit(0);
  }

  if (result.errors.length > 0) {
    fail(result.errors);
  }

  console.log(result.message);
}
