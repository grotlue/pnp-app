import { vercelAdapter } from "@flags-sdk/vercel";
import { type Flag, flag, getProviderData } from "flags/next";
import { getProviderData as getVercelProviderData } from "@flags-sdk/vercel";
import { mergeProviderData, type ProviderData } from "flags";
import {
  FEATURE_FLAG_PROVIDER_LIST,
  FEATURE_FLAG_PROVIDERS,
  NODE_ENV_VALUES,
  RUNTIME_ENVIRONMENT_LIST,
  RUNTIME_ENVIRONMENTS,
  type FeatureFlagProvider as SharedFeatureFlagProvider,
  type RuntimeEnvironment as SharedRuntimeEnvironment,
} from "./constants";

type RuntimeEnvironment = SharedRuntimeEnvironment;
type FeatureFlagProvider = SharedFeatureFlagProvider;
type FeatureFlag = "selfRegistration";

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

const knownFeatureFlags = new Set<FeatureFlag>(
  Object.keys(featureRules) as FeatureFlag[],
);
const knownProviders = new Set<FeatureFlagProvider>(FEATURE_FLAG_PROVIDER_LIST);
const isTestEnvironment = process.env.NODE_ENV === NODE_ENV_VALUES.test;
const flagOptions = [
  { label: "Disabled", value: false },
  { label: "Enabled", value: true },
];

const normalizeRuntimeEnvironment = (
  value?: string | null,
): RuntimeEnvironment | null => {
  if (!value) {
    return null;
  }

  if (RUNTIME_ENVIRONMENT_LIST.includes(value as RuntimeEnvironment)) {
    return value as RuntimeEnvironment;
  }

  return null;
};

const normalizeProvider = (
  value?: string | null,
): FeatureFlagProvider | null => {
  if (!value) {
    return null;
  }

  return knownProviders.has(value as FeatureFlagProvider)
    ? (value as FeatureFlagProvider)
    : null;
};

const resolveRuntimeEnvironment = (): RuntimeEnvironment => {
  const explicitEnvironment = normalizeRuntimeEnvironment(process.env.APP_ENV);
  if (explicitEnvironment) {
    return explicitEnvironment;
  }

  const vercelEnvironment = normalizeRuntimeEnvironment(process.env.VERCEL_ENV);
  if (vercelEnvironment) {
    return vercelEnvironment;
  }

  return RUNTIME_ENVIRONMENTS.development;
};

const resolveFeatureFlagProvider = (): FeatureFlagProvider => {
  const explicitProvider = normalizeProvider(
    process.env.FEATURE_FLAGS_PROVIDER,
  );
  if (explicitProvider) {
    return explicitProvider;
  }

  // Vercel flags-client uses the FLAGS connection string environment variable.
  if (process.env.FLAGS) {
    return FEATURE_FLAG_PROVIDERS.vercel;
  }

  return FEATURE_FLAG_PROVIDERS.rules;
};

const parseFeatureOverrideList = (raw?: string): Set<FeatureFlag> => {
  if (!raw) {
    return new Set();
  }

  const values = raw
    .split(",")
    .map((value) => value.trim())
    .filter((value): value is FeatureFlag =>
      knownFeatureFlags.has(value as FeatureFlag),
    );

  return new Set(values);
};

const getFeatureDefaultValue = (
  feature: FeatureFlag,
  environment: RuntimeEnvironment = resolveRuntimeEnvironment(),
): boolean => {
  return !featureRules[feature].disabledIn.includes(environment);
};

const getFeatureOverride = (feature: FeatureFlag): boolean | null => {
  const forceDisabled = parseFeatureOverrideList(
    process.env.FEATURE_FLAGS_DISABLE,
  );
  if (forceDisabled.has(feature)) {
    return false;
  }

  const forceEnabled = parseFeatureOverrideList(
    process.env.FEATURE_FLAGS_ENABLE,
  );
  if (forceEnabled.has(feature)) {
    return true;
  }

  return null;
};

const evaluateWithRulesProvider = async (
  feature: FeatureFlag,
): Promise<boolean> => {
  return rulesFeatureFlags[feature]();
};

const evaluateWithVercelAdapter = async (
  feature: FeatureFlag,
): Promise<boolean> => {
  return getVercelFeatureFlags()[feature]();
};

const createRulesFeatureFlag = (
  feature: FeatureFlag,
): Flag<boolean, unknown> => {
  return flag<boolean>({
    key: feature,
    description: featureRules[feature].description,
    defaultValue: getFeatureDefaultValue(feature),
    options: flagOptions,
    decide: () => getFeatureDefaultValue(feature),
  });
};

const createVercelFeatureFlag = (
  feature: FeatureFlag,
): Flag<boolean, unknown> => {
  return flag<boolean>({
    key: feature,
    description: featureRules[feature].description,
    defaultValue: getFeatureDefaultValue(feature),
    options: flagOptions,
    adapter: vercelAdapter<boolean, unknown>(),
  });
};

const rulesFeatureFlags: Record<FeatureFlag, Flag<boolean, unknown>> = {
  selfRegistration: createRulesFeatureFlag("selfRegistration"),
};

const getVercelFeatureFlags = (): Record<
  FeatureFlag,
  Flag<boolean, unknown>
> => {
  return {
    selfRegistration: createVercelFeatureFlag("selfRegistration"),
  };
};

const getActiveFeatureFlags = (): Record<
  FeatureFlag,
  Flag<boolean, unknown>
> => {
  if (resolveFeatureFlagProvider() === "vercel" && process.env.FLAGS) {
    return getVercelFeatureFlags();
  }

  return rulesFeatureFlags;
};

const getFeatureFlagsProviderData = async (): Promise<ProviderData> => {
  const activeFlags = getActiveFeatureFlags();
  const baseProviderData = getProviderData(activeFlags);

  if (resolveFeatureFlagProvider() !== "vercel" || !process.env.FLAGS) {
    return baseProviderData;
  }

  try {
    const vercelProviderData = await getVercelProviderData(activeFlags);
    return mergeProviderData([baseProviderData, vercelProviderData]);
  } catch (error) {
    console.warn(
      "feature flags: failed to load Vercel provider metadata",
      error,
    );
    return baseProviderData;
  }
};

const isFeatureEnabled = async (feature: FeatureFlag): Promise<boolean> => {
  const override = getFeatureOverride(feature);
  if (override !== null) {
    return override;
  }

  if (isTestEnvironment) {
    return getFeatureDefaultValue(feature);
  }

  const provider = resolveFeatureFlagProvider();
  if (provider === "vercel") {
    if (process.env.FLAGS) {
      return evaluateWithVercelAdapter(feature);
    }

    console.warn(
      "feature flags: FEATURE_FLAGS_PROVIDER=vercel set without FLAGS; falling back to rules provider.",
    );
  }

  return evaluateWithRulesProvider(feature);
};

export type { FeatureFlag, FeatureFlagProvider, RuntimeEnvironment };
export {
  getFeatureFlagsProviderData,
  isFeatureEnabled,
  resolveFeatureFlagProvider,
  resolveRuntimeEnvironment,
};
