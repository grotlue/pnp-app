import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { expect, type Page, test } from "@playwright/test";
import {
  KNOWN_TARGETS,
  PUBLIC_ROUTES,
  sanitizeRouteForFileName,
} from "../../scripts/pr-screenshot-targets.config.mjs";
import { loginAsFixtureUser } from "./support/auth";

const screenshotDir =
  process.env.PR_SCREENSHOT_DIR ?? "artifacts/pr-screenshots";

type ResolvedTarget = {
  route: string;
  fileName: string;
  requiresAuth: boolean;
};

const parseCsvEnv = (envValue: string | undefined): string[] => {
  if (!envValue) {
    return [];
  }

  return envValue
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
};

const resolveTargets = (): ResolvedTarget[] => {
  const knownTargetsEnv = process.env.PR_SCREENSHOT_TARGETS;
  const requestedKnownTargets = parseCsvEnv(knownTargetsEnv);
  const extraRoutes = parseCsvEnv(process.env.PR_SCREENSHOT_EXTRA_ROUTES);

  const knownTargets =
    knownTargetsEnv === undefined
      ? KNOWN_TARGETS
      : KNOWN_TARGETS.filter((target) =>
          requestedKnownTargets.includes(target.id),
        );

  const extraTargets = extraRoutes.map((route) => ({
    route,
    fileName: `99-extra-${sanitizeRouteForFileName(route)}.png`,
    requiresAuth: !PUBLIC_ROUTES.has(route),
  }));

  return [...knownTargets, ...extraTargets];
};

const resolvedTargets = resolveTargets();
const publicTargets = resolvedTargets.filter((target) => !target.requiresAuth);
const authenticatedTargets = resolvedTargets.filter(
  (target) => target.requiresAuth,
);

const screenshotPath = (fileName: string): string => {
  return join(screenshotDir, fileName);
};

const captureRouteScreenshot = async (
  page: Page,
  route: string,
  fileName: string,
): Promise<void> => {
  await page.goto(route);
  await expect(page.locator("main").first()).toBeVisible();
  await page.screenshot({ path: screenshotPath(fileName), fullPage: true });
};

test.beforeAll(() => {
  mkdirSync(screenshotDir, { recursive: true });
});

test("FLOW-PR-SCREENSHOTS-PUBLIC @smoke @auth captures public route screenshots", async ({
  page,
}) => {
  test.skip(
    publicTargets.length === 0,
    "No public screenshot targets selected for this PR.",
  );

  for (const target of publicTargets) {
    await captureRouteScreenshot(page, target.route, target.fileName);
  }
});

test("FLOW-PR-SCREENSHOTS-AUTHENTICATED @smoke @campaigns @characters @notifications captures authenticated route screenshots", async ({
  page,
}) => {
  test.skip(
    authenticatedTargets.length === 0,
    "No authenticated screenshot targets selected for this PR.",
  );

  await loginAsFixtureUser(page);

  for (const target of authenticatedTargets) {
    await captureRouteScreenshot(page, target.route, target.fileName);
  }
});
