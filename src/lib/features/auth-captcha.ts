export type RuntimeEnvironment = "development" | "preview" | "production";
export type AuthCaptchaMode = "off" | "optional" | "required";

type AuthCaptchaClientConfig = {
  mode: AuthCaptchaMode;
  required: boolean;
  siteKey: string | null;
  enabled: boolean;
};

const KNOWN_CAPTCHA_MODES = new Set<AuthCaptchaMode>(["off", "optional", "required"]);

function normalizeRuntimeEnvironment(value?: string | null): RuntimeEnvironment | null {
  if (!value) {
    return null;
  }

  if (value === "development" || value === "preview" || value === "production") {
    return value;
  }

  return null;
}

function normalizeCaptchaMode(value?: string | null): AuthCaptchaMode | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (KNOWN_CAPTCHA_MODES.has(normalized as AuthCaptchaMode)) {
    return normalized as AuthCaptchaMode;
  }

  return null;
}

export function resolveAuthCaptchaRuntimeEnvironment(): RuntimeEnvironment {
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

export function resolveClientAuthCaptchaMode(): AuthCaptchaMode {
  const explicitMode = normalizeCaptchaMode(process.env.NEXT_PUBLIC_AUTH_CAPTCHA_MODE);
  if (explicitMode) {
    return explicitMode;
  }

  const environment = resolveAuthCaptchaRuntimeEnvironment();
  if (environment === "preview" || environment === "production") {
    return "optional";
  }

  return "off";
}

export function getTurnstileSiteKey(): string | null {
  const value = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
  return value ? value : null;
}

export function resolveAuthCaptchaClientConfig(): AuthCaptchaClientConfig {
  const mode = resolveClientAuthCaptchaMode();
  const siteKey = getTurnstileSiteKey();

  return {
    mode,
    required: mode === "required",
    siteKey,
    enabled: mode !== "off" && Boolean(siteKey),
  };
}
