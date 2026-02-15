export type RuntimeEnvironment = "development" | "preview" | "production";

export type FeatureFlag = "selfRegistration";

type FeatureRule = {
  disabledIn: RuntimeEnvironment[];
};

const featureRules: Record<FeatureFlag, FeatureRule> = {
  selfRegistration: {
    disabledIn: ["production"],
  },
};

const knownFeatureFlags = new Set<FeatureFlag>(Object.keys(featureRules) as FeatureFlag[]);

function normalizeRuntimeEnvironment(value?: string | null): RuntimeEnvironment | null {
  if (!value) {
    return null;
  }

  if (value === "development" || value === "preview" || value === "production") {
    return value;
  }

  return null;
}

function parseFeatureOverrideList(raw?: string): Set<FeatureFlag> {
  if (!raw) {
    return new Set();
  }

  const values = raw
    .split(",")
    .map((value) => value.trim())
    .filter((value): value is FeatureFlag => knownFeatureFlags.has(value as FeatureFlag));

  return new Set(values);
}

export function resolveRuntimeEnvironment(): RuntimeEnvironment {
  const explicitEnvironment = normalizeRuntimeEnvironment(process.env.APP_ENV);
  if (explicitEnvironment) {
    return explicitEnvironment;
  }

  const vercelEnvironment = normalizeRuntimeEnvironment(process.env.VERCEL_ENV);
  if (vercelEnvironment) {
    return vercelEnvironment;
  }

  return "development";
}

export function isFeatureEnabled(
  feature: FeatureFlag,
  environment: RuntimeEnvironment = resolveRuntimeEnvironment(),
): boolean {
  const forceDisabled = parseFeatureOverrideList(process.env.FEATURE_FLAGS_DISABLE);
  if (forceDisabled.has(feature)) {
    return false;
  }

  const forceEnabled = parseFeatureOverrideList(process.env.FEATURE_FLAGS_ENABLE);
  if (forceEnabled.has(feature)) {
    return true;
  }

  return !featureRules[feature].disabledIn.includes(environment);
}
