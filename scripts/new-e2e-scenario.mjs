import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const VALID_DOMAINS = [
  "auth",
  "campaigns",
  "characters",
  "relationships",
  "notifications",
];

const VALID_LEVELS = ["smoke", "regression"];

function usage() {
  console.log(
    `Usage:\n  node scripts/new-e2e-scenario.mjs --domain <${VALID_DOMAINS.join("|")}> --slug <kebab-case> --level <smoke|regression> [--description <text>] [--file <name>]`,
  );
}

function parseArgs(argv) {
  const args = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      throw new Error(`Unexpected argument: ${token}`);
    }

    const key = token.slice(2);
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for --${key}`);
    }

    args[key] = value;
    index += 1;
  }

  return args;
}

function assertValid(args) {
  if (!VALID_DOMAINS.includes(args.domain)) {
    throw new Error(`Invalid --domain. Allowed: ${VALID_DOMAINS.join(", ")}`);
  }

  if (!VALID_LEVELS.includes(args.level)) {
    throw new Error(`Invalid --level. Allowed: ${VALID_LEVELS.join(", ")}`);
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(args.slug)) {
    throw new Error(
      "Invalid --slug. Use kebab-case (letters, numbers, hyphens).",
    );
  }
}

function toScenarioId(domain, slug) {
  return `FLOW-${domain.toUpperCase()}-${slug.toUpperCase()}`;
}

function toDefaultFilename(level, domain, slug) {
  return `${level}-${domain}-${slug}.spec.ts`;
}

function buildTemplate({ scenarioId, level, domain, description }) {
  const title = `${scenarioId} @${level} @${domain} ${description}`;

  return `import { expect, test } from "@playwright/test";

test("${title}", async ({ page }) => {
  // Arrange: set up fixture state and open the relevant route.
  await page.goto("/");

  // Act: execute user-observable happy-path actions.

  // Assert: verify visible state, navigation result, and persisted outcome.
  await expect(page).toHaveURL(/\\//);
});
`;
}

function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (error) {
    usage();
    throw error;
  }

  assertValid(args);

  const scenarioId = toScenarioId(args.domain, args.slug);
  const description =
    args.description ?? "covers user-visible happy path assertions";

  const fileName =
    args.file ?? toDefaultFilename(args.level, args.domain, args.slug);
  if (!fileName.endsWith(".spec.ts")) {
    throw new Error("--file must end with .spec.ts");
  }

  const outputDirectory = join("tests", "e2e");
  mkdirSync(outputDirectory, { recursive: true });

  const outputPath = join(outputDirectory, fileName);
  if (existsSync(outputPath)) {
    throw new Error(`Refusing to overwrite existing file: ${outputPath}`);
  }

  writeFileSync(
    outputPath,
    buildTemplate({
      scenarioId,
      level: args.level,
      domain: args.domain,
      description,
    }),
    "utf8",
  );

  console.log(`Created ${outputPath}`);
  console.log(`Scenario ID: ${scenarioId}`);
  console.log(`Tags: @${args.level} @${args.domain}`);
}

try {
  main();
} catch (error) {
  console.error(String(error instanceof Error ? error.message : error));
  process.exit(1);
}
