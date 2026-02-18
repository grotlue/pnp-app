import { writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export const HIGH_RISK_PATH_PATTERNS = [
  /^src\/app\/api\//,
  /^server\/auth\//,
  /^server\/supabase\//,
  /^server\/rate-limit\//,
  /^supabase\/migrations\//,
  /^supabase\/config\.toml$/,
  /^SECURITY\.md$/,
];

export const IMPACT_SIGNALS = [
  "Security impact",
  "Data model impact",
  "Performance impact",
];

function isChecked(body, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^-\\s*\\[x\\]\\s*${escaped}\\s*$`, "im").test(body);
}

function parseChangedFiles(raw) {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((value) => typeof value === "string");
    }
  } catch {
    // Fall back to newline parsing.
  }

  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function detectRegressionRisk({ prBody, changedFiles }) {
  const reasons = [];

  for (const signal of IMPACT_SIGNALS) {
    if (isChecked(prBody, signal)) {
      reasons.push(`PR template impact signal checked: ${signal}`);
    }
  }

  const sensitivePaths = changedFiles.filter((filePath) =>
    HIGH_RISK_PATH_PATTERNS.some((pattern) => pattern.test(filePath)),
  );

  for (const filePath of sensitivePaths) {
    reasons.push(`Sensitive path changed: ${filePath}`);
  }

  return {
    shouldLabel: reasons.length > 0,
    reasons,
  };
}

function writeOutputs(outputs) {
  const outputPath = process.env.GITHUB_OUTPUT;
  if (!outputPath) {
    return;
  }

  const lines = Object.entries(outputs).map(
    ([key, value]) => `${key}=${value}`,
  );
  writeFileSync(outputPath, `${lines.join("\n")}\n`, { flag: "a" });
}

function main() {
  const prBody = process.env.PR_BODY ?? "";
  const changedFiles = parseChangedFiles(process.env.CHANGED_FILES_JSON ?? "");
  const result = detectRegressionRisk({ prBody, changedFiles });

  writeOutputs({
    should_label: String(result.shouldLabel),
    reasons: JSON.stringify(result.reasons),
  });

  if (result.shouldLabel) {
    console.log(
      `Auto-label decision: label required (${result.reasons.join("; ")})`,
    );
  } else {
    console.log("Auto-label decision: no label required.");
  }
}

if (
  process.argv[1] &&
  pathToFileURL(process.argv[1]).href === import.meta.url
) {
  main();
}
