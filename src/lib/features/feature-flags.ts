import { vercelAdapter } from "@flags-sdk/vercel";
import { flag } from "flags/next";

export type RuntimeEnvironment = "development" | "preview" | "production";
export type FeatureFlagProvider = "rules" | "vercel";
export type FeatureFlag = "selfRegistration";

type FeatureRule = {
  disabledIn: RuntimeEnvironment[];
  description: string;
};

const featureRules: Record<FeatureFlag, FeatureRule> = {
  selfRegistration: {
    disabledIn: ["production"],
    description: "Allow user self-registration",
  },
};

const knownFeatureFlags = new Set<FeatureFlag>(Object.keys(featureRules) as FeatureFlag[]);
const knownProviders = new Set<FeatureFlagProvider>(["rules", "vercel"]);

function normalizeRuntimeEnvironment(value?: string | null): RuntimeEnvironment | null {
  if (!value) {
    return null;
  }

  if (value === "development" || value === "preview" || value === "production") {
    return value;
  }

  return null;
}

function normalizeProvider(value?: string | null): FeatureFlagProvider | null {
  if (!value) {
    return null;
  }

  return knownProviders.has(value as FeatureFlagProvider) ? (value as FeatureFlagProvider) : null;
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

function getFeatureDefaultValue(
  feature: FeatureFlag,
  environment: RuntimeEnvironment = resolveRuntimeEnvironment(),
): boolean {
  return !featureRules[feature].disabledIn.includes(environment);
}

function getFeatureOverride(feature: FeatureFlag): boolean | null {
  const forceDisabled = parseFeatureOverrideList(process.env.FEATURE_FLAGS_DISABLE);
  if (forceDisabled.has(feature)) {
    return false;
  }

  const forceEnabled = parseFeatureOverrideList(process.env.FEATURE_FLAGS_ENABLE);
  if (forceEnabled.has(feature)) {
    return true;
  }

  return null;
}

async function evaluateWithVercelAdapter(feature: FeatureFlag): Promise<boolean> {
  const featureFlag = flag<boolean>({
    key: feature,
    description: featureRules[feature].description,
    defaultValue: getFeatureDefaultValue(feature),
    options: [
      { label: "Disabled", value: false },
      { label: "Enabled", value: true },
    ],
    adapter: vercelAdapter<boolean, unknown>(),
  });

  return featureFlag();
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

export function resolveFeatureFlagProvider(): FeatureFlagProvider {
  const explicitProvider = normalizeProvider(process.env.FEATURE_FLAGS_PROVIDER);
  if (explicitProvider) {
    return explicitProvider;
  }

  // Vercel flags-client uses the FLAGS connection string environment variable.
  if (process.env.FLAGS) {
    return "vercel";
  }

  return "rules";
}

export async function isFeatureEnabled(feature: FeatureFlag): Promise<boolean> {
  const override = getFeatureOverride(feature);
  if (override !== null) {
    return override;
  }

  const provider = resolveFeatureFlagProvider();
  if (provider === "vercel") {
    return evaluateWithVercelAdapter(feature);
  }

  return getFeatureDefaultValue(feature);
}
