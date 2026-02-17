type RuntimeEnvironment = "development" | "preview" | "production";

function normalizeRuntimeEnvironment(
  value?: string | null,
): RuntimeEnvironment | null {
  if (!value) {
    return null;
  }

  if (
    value === "development" ||
    value === "preview" ||
    value === "production"
  ) {
    return value;
  }

  return null;
}

export function resolvePerformanceRuntimeEnvironment(): RuntimeEnvironment {
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

export function resolveSpeedInsightsEnabled(): boolean {
  const explicit = process.env.ENABLE_VERCEL_SPEED_INSIGHTS;
  if (explicit === "true") {
    return true;
  }

  if (explicit === "false") {
    return false;
  }

  const environment = resolvePerformanceRuntimeEnvironment();
  return environment === "preview" || environment === "production";
}
