import {
  AUTH_CAPTCHA_MODE_LIST,
  AUTH_CAPTCHA_MODES,
  PRODUCTION_RUNTIME_ENVIRONMENTS,
  RUNTIME_ENVIRONMENT_LIST,
  RUNTIME_ENVIRONMENTS,
  type AuthCaptchaMode,
  type RuntimeEnvironment,
} from "./constants";

export type { AuthCaptchaMode, RuntimeEnvironment };

type AuthCaptchaClientConfig = {
  mode: AuthCaptchaMode;
  required: boolean;
  siteKey: string | null;
  enabled: boolean;
};

const KNOWN_CAPTCHA_MODES = new Set<AuthCaptchaMode>(AUTH_CAPTCHA_MODE_LIST);

function normalizeEnvValue(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const unquoted =
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
      ? trimmed.slice(1, -1).trim()
      : trimmed;

  return unquoted ? unquoted.toLowerCase() : null;
}

function normalizeRuntimeEnvironment(
  value?: string | null,
): RuntimeEnvironment | null {
  const normalized = normalizeEnvValue(value);
  if (!normalized) {
    return null;
  }

  if (RUNTIME_ENVIRONMENT_LIST.includes(normalized as RuntimeEnvironment)) {
    return normalized as RuntimeEnvironment;
  }

  return null;
}

function normalizeCaptchaMode(value?: string | null): AuthCaptchaMode | null {
  const normalized = normalizeEnvValue(value);
  if (!normalized) {
    return null;
  }

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

  return RUNTIME_ENVIRONMENTS.development;
}

export function resolveClientAuthCaptchaMode(): AuthCaptchaMode {
  const explicitMode = normalizeCaptchaMode(
    process.env.NEXT_PUBLIC_AUTH_CAPTCHA_MODE,
  );
  if (explicitMode) {
    return explicitMode;
  }

  const environment = resolveAuthCaptchaRuntimeEnvironment();
  if (PRODUCTION_RUNTIME_ENVIRONMENTS.has(environment)) {
    return AUTH_CAPTCHA_MODES.optional;
  }

  return AUTH_CAPTCHA_MODES.off;
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
    required: mode === AUTH_CAPTCHA_MODES.required,
    siteKey,
    enabled: mode !== AUTH_CAPTCHA_MODES.off && Boolean(siteKey),
  };
}
