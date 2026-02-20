export const KNOWN_TARGETS = [
  { id: "login", route: "/", fileName: "01-login.png", requiresAuth: false },
  {
    id: "register",
    route: "/register",
    fileName: "02-register.png",
    requiresAuth: false,
  },
  {
    id: "password-reset",
    route: "/password-reset",
    fileName: "03-password-reset.png",
    requiresAuth: false,
  },
  {
    id: "campaigns",
    route: "/campaigns",
    fileName: "04-campaigns.png",
    requiresAuth: true,
  },
  {
    id: "characters",
    route: "/characters",
    fileName: "05-characters.png",
    requiresAuth: true,
  },
  {
    id: "notifications",
    route: "/notifications",
    fileName: "06-notifications.png",
    requiresAuth: true,
  },
  {
    id: "dashboard",
    route: "/dashboard",
    fileName: "07-dashboard.png",
    requiresAuth: true,
  },
  {
    id: "profile",
    route: "/profile",
    fileName: "08-profile.png",
    requiresAuth: true,
  },
  {
    id: "settings",
    route: "/settings",
    fileName: "09-settings.png",
    requiresAuth: true,
  },
  {
    id: "users-avatars",
    route: "/users/avatars",
    fileName: "10-users-avatars.png",
    requiresAuth: true,
  },
];

export const KNOWN_TARGET_IDS = new Set(
  KNOWN_TARGETS.map((target) => target.id),
);
export const PUBLIC_ROUTES = new Set(["/", "/register", "/password-reset"]);
export const EXTRA_ROUTE_EXCLUDE_PREFIXES = [
  "/admin",
  "/api",
  "/auth/callback",
];
export const EXTRA_ROUTE_EXACT_EXCLUDES = new Set([
  "/auth",
  "/auth/reset-password",
]);

export const TARGET_RULES = [
  {
    targetId: "login",
    patterns: [
      /^src\/app\/page\.tsx$/,
      /^src\/page-modules\/home-page\.tsx$/,
      /^src\/app\/auth\/page\.tsx$/,
      /^src\/features\/users\/queries\/users-auth\.query\.ts$/,
      /^src\/features\/users\/logic\/auth\.logic\.ts$/,
      /^src\/app\/api\/auth\/login\/route\.ts$/,
      /^src\/app\/api\/auth\/logout\/route\.ts$/,
      /^src\/server\/auth\//,
    ],
  },
  {
    targetId: "register",
    patterns: [
      /^src\/app\/register\/page\.tsx$/,
      /^src\/page-modules\/register-page\.tsx$/,
      /^src\/app\/api\/auth\/register\//,
    ],
  },
  {
    targetId: "password-reset",
    patterns: [
      /^src\/app\/password-reset\/page\.tsx$/,
      /^src\/app\/auth\/reset-password\/page\.tsx$/,
      /^src\/page-modules\/password-reset-page\.tsx$/,
      /^src\/page-modules\/auth-reset-password-page\.tsx$/,
      /^src\/app\/api\/auth\/password-reset\//,
    ],
  },
  {
    targetId: "campaigns",
    patterns: [
      /^src\/app\/campaigns\//,
      /^src\/page-modules\/campaigns-page\.tsx$/,
      /^src\/page-modules\/campaign-detail-page\.tsx$/,
      /^src\/features\/campaigns\//,
      /^src\/app\/api\/campaigns\//,
    ],
  },
  {
    targetId: "characters",
    patterns: [
      /^src\/app\/characters\//,
      /^src\/page-modules\/characters-page\.tsx$/,
      /^src\/page-modules\/character-detail-page\.tsx$/,
      /^src\/page-modules\/character-edit-page\.tsx$/,
      /^src\/page-modules\/character-detail-modals\.tsx$/,
      /^src\/features\/characters\//,
      /^src\/features\/relationships\//,
      /^src\/app\/api\/characters\//,
      /^src\/app\/api\/storage\/character-images\//,
    ],
  },
  {
    targetId: "notifications",
    patterns: [
      /^src\/app\/notifications\/page\.tsx$/,
      /^src\/page-modules\/notifications-page\.tsx$/,
      /^src\/features\/notifications\//,
      /^src\/app\/api\/notifications\//,
    ],
  },
  {
    targetId: "dashboard",
    patterns: [
      /^src\/app\/dashboard\/page\.tsx$/,
      /^src\/app\/admin\/page\.tsx$/,
      /^src\/app\/admin\/mfa-challenge\/page\.tsx$/,
      /^src\/page-modules\/admin-page\.tsx$/,
      /^src\/page-modules\/admin-page-forms\.tsx$/,
      /^src\/page-modules\/admin-mfa-challenge-page\.tsx$/,
      /^src\/features\/admin\//,
      /^src\/app\/api\/admin\//,
    ],
  },
  {
    targetId: "profile",
    patterns: [
      /^src\/app\/profile\/page\.tsx$/,
      /^src\/app\/users\/\[userId\]\/page\.tsx$/,
      /^src\/page-modules\/profile-page\.tsx$/,
      /^src\/page-modules\/user-profile-page\.tsx$/,
      /^src\/features\/users\//,
      /^src\/app\/api\/me\/profile\/route\.ts$/,
      /^src\/app\/api\/storage\/profile-images\//,
    ],
  },
  {
    targetId: "settings",
    patterns: [
      /^src\/app\/settings\/page\.tsx$/,
      /^src\/page-modules\/settings-page\.tsx$/,
      /^src\/features\/users\/queries\/users-settings\.query\.ts$/,
      /^src\/app\/api\/me\/settings\//,
    ],
  },
  {
    targetId: "users-avatars",
    patterns: [
      /^src\/app\/users\/avatars\/page\.tsx$/,
      /^src\/page-modules\/users-avatars-page\.tsx$/,
      /^src\/app\/api\/users\/avatars\//,
      /^src\/features\/users\/queries\/users-avatar-list\.query\.ts$/,
    ],
  },
];

export const GLOBAL_UI_PATTERNS = [
  /^src\/components\/ui\//,
  /^src\/components\/common\//,
  /^src\/app\/layout\.tsx$/,
  /^src\/app\/template\.tsx$/,
  /^src\/app\/app\.tsx$/,
  /^src\/app\/router\.tsx$/,
  /^src\/app\/globals\.css$/,
];

export const GLOBAL_FALLBACK_TARGETS = [
  "login",
  "campaigns",
  "characters",
  "notifications",
];

const MAPPING_RELEVANT_PATTERNS = [
  /^src\/app\/page\.tsx$/,
  /^src\/app\/.+\/page\.tsx$/,
  /^src\/page-modules\/.+\.tsx$/,
  /^src\/features\/.+\.(ts|tsx)$/,
  /^src\/components\/(ui|common)\/.+\.tsx$/,
];

const MAPPING_EXCLUDE_PATTERNS = [
  /^src\/app\/api\//,
  /^src\/app\/admin\//,
  /^src\/app\/auth\/callback\/page\.tsx$/,
  /^src\/app\/auth\/reset-password\/page\.tsx$/,
  /^src\/page-modules\/auth-callback-page\.tsx$/,
  /^src\/page-modules\/auth-reset-password-page\.tsx$/,
  /^src\/page-modules\/tests\//,
  /^src\/features\/.+\/tests\//,
  /^src\/features\/.+\/types\.ts$/,
];

export function sanitizeRouteForFileName(route) {
  return route
    .replace(/^\//, "")
    .replace(/[^a-zA-Z0-9/-]/g, "")
    .replace(/\//g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

export function inferExtraRoutes(changedFiles) {
  const routes = new Set();

  for (const file of changedFiles) {
    const match = file.match(/^src\/app\/(.+)\/page\.tsx$/);
    if (!match) {
      continue;
    }

    const segment = match[1];
    if (segment.includes("[") || segment.includes("]")) {
      continue;
    }

    const route = `/${segment}`;

    if (EXTRA_ROUTE_EXACT_EXCLUDES.has(route)) {
      continue;
    }

    if (
      EXTRA_ROUTE_EXCLUDE_PREFIXES.some((prefix) => route.startsWith(prefix))
    ) {
      continue;
    }

    routes.add(route);
  }

  return [...routes].sort((a, b) => a.localeCompare(b));
}

function shouldCaptureGlobalFallback(changedFiles) {
  return changedFiles.some((file) =>
    GLOBAL_UI_PATTERNS.some((pattern) => pattern.test(file)),
  );
}

export function detectKnownTargets(changedFiles) {
  const targets = new Set();

  for (const rule of TARGET_RULES) {
    const isMatched = changedFiles.some((file) =>
      rule.patterns.some((pattern) => pattern.test(file)),
    );

    if (isMatched) {
      targets.add(rule.targetId);
    }
  }

  if (shouldCaptureGlobalFallback(changedFiles)) {
    for (const targetId of GLOBAL_FALLBACK_TARGETS) {
      targets.add(targetId);
    }
  }

  return [...targets].filter((targetId) => KNOWN_TARGET_IDS.has(targetId));
}

export function isMappingRelevantFile(file) {
  return MAPPING_RELEVANT_PATTERNS.some((pattern) => pattern.test(file));
}

export function isMappingExcludedFile(file) {
  return MAPPING_EXCLUDE_PATTERNS.some((pattern) => pattern.test(file));
}

export function findUnmappedFiles(changedFiles) {
  return changedFiles.filter((file) => {
    if (!isMappingRelevantFile(file) || isMappingExcludedFile(file)) {
      return false;
    }

    const knownTargets = detectKnownTargets([file]);
    const extraRoutes = inferExtraRoutes([file]);
    const globalMatch = GLOBAL_UI_PATTERNS.some((pattern) =>
      pattern.test(file),
    );

    return (
      knownTargets.length === 0 && extraRoutes.length === 0 && !globalMatch
    );
  });
}

export function buildExpectedFilesMarkdown(targetIds, extraRoutes) {
  const files = [];

  for (const targetId of targetIds) {
    const target = KNOWN_TARGETS.find((entry) => entry.id === targetId);
    if (target) {
      files.push(target.fileName);
    }
  }

  for (const route of extraRoutes) {
    files.push(`99-extra-${sanitizeRouteForFileName(route)}.png`);
  }

  if (files.length === 0) {
    return "- none";
  }

  return files.map((file) => `- \`${file}\``).join("\n");
}

export function markdownList(values, mapValue) {
  if (values.length === 0) {
    return "- none";
  }

  const items = mapValue ? values.map(mapValue) : values;
  return items.map((item) => `- ${item}`).join("\n");
}
