import { readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import {
  EXTRA_ROUTE_EXACT_EXCLUDES,
  EXTRA_ROUTE_EXCLUDE_PREFIXES,
  KNOWN_TARGETS,
  TARGET_RULES,
  detectKnownTargets,
} from "../pr-screenshot-targets.config.mjs";

function listFilesRecursively(rootDir: string): string[] {
  const files: string[] = [];
  const queue = [rootDir];

  while (queue.length > 0) {
    const currentDir = queue.shift();
    if (!currentDir) {
      continue;
    }

    const entries = readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const absolutePath = join(currentDir, entry.name);
      if (entry.isDirectory()) {
        queue.push(absolutePath);
        continue;
      }

      const repoPath = relative(process.cwd(), absolutePath).replace(
        /\\/g,
        "/",
      );
      files.push(repoPath);
    }
  }

  return files.sort((a, b) => a.localeCompare(b));
}

function appPageRouteFromFile(file: string): string | null {
  if (file === "src/app/page.tsx") {
    return "/";
  }

  if (!file.startsWith("src/app/") || !file.endsWith("/page.tsx")) {
    return null;
  }

  const segment = file.slice("src/app/".length, -"/page.tsx".length);
  if (segment.includes("[") || segment.includes("]")) {
    return null;
  }

  return `/${segment}`;
}

describe("pr screenshot mappings", () => {
  it("covers all top-level non-admin routes with known targets", () => {
    const appPageFiles = listFilesRecursively("src/app").filter(
      (file) => file === "src/app/page.tsx" || file.endsWith("/page.tsx"),
    );
    const knownRoutes = new Set(KNOWN_TARGETS.map((target) => target.route));

    for (const file of appPageFiles) {
      const route = appPageRouteFromFile(file);
      if (!route) {
        continue;
      }

      if (
        EXTRA_ROUTE_EXCLUDE_PREFIXES.some((prefix) => route.startsWith(prefix))
      ) {
        continue;
      }

      if (EXTRA_ROUTE_EXACT_EXCLUDES.has(route)) {
        continue;
      }

      expect(
        knownRoutes.has(route),
        `Missing known screenshot target for route ${route} (${file})`,
      ).toBe(true);
    }
  });

  it("maps all screenshot-relevant page modules", () => {
    const excludedPageModules = new Set([
      "src/page-modules/auth-callback-page.tsx",
    ]);
    const pageModuleFiles = listFilesRecursively("src/page-modules").filter(
      (file) => file.endsWith("-page.tsx"),
    );

    for (const file of pageModuleFiles) {
      if (excludedPageModules.has(file)) {
        continue;
      }

      expect(
        detectKnownTargets([file]).length > 0,
        `Missing screenshot mapping for page module ${file}`,
      ).toBe(true);
    }
  });

  it("has explicit feature-domain coverage rules", () => {
    const featureDomains = readdirSync("src/features", {
      withFileTypes: true,
    })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b));
    const ruleSources = TARGET_RULES.flatMap((rule) =>
      rule.patterns.map((pattern) => pattern.source),
    );

    for (const domain of featureDomains) {
      const domainSourcePrefix = `^src\\/features\\/${domain}\\/`;
      const hasDomainRule = ruleSources.some((source) =>
        source.startsWith(domainSourcePrefix),
      );
      expect(
        hasDomainRule,
        `Add screenshot mapping rule for feature domain src/features/${domain}/`,
      ).toBe(true);
    }
  });
});
