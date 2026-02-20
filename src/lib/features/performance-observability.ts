import {
  BOOLEAN_ENV_VALUES,
  PRODUCTION_RUNTIME_ENVIRONMENTS,
  RUNTIME_ENVIRONMENT_LIST,
  RUNTIME_ENVIRONMENTS,
  type RuntimeEnvironment,
} from "./constants";

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

const resolvePerformanceRuntimeEnvironment = (): RuntimeEnvironment => {
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

const resolveSpeedInsightsEnabled = (): boolean => {
  const explicit = process.env.ENABLE_VERCEL_SPEED_INSIGHTS;
  if (explicit === BOOLEAN_ENV_VALUES.true) {
    return true;
  }

  if (explicit === BOOLEAN_ENV_VALUES.false) {
    return false;
  }

  const environment = resolvePerformanceRuntimeEnvironment();
  return PRODUCTION_RUNTIME_ENVIRONMENTS.has(environment);
};

export { resolvePerformanceRuntimeEnvironment, resolveSpeedInsightsEnabled };
