import {
  AUTH_CAPTCHA_MODE_LIST,
  AUTH_CAPTCHA_MODES,
  type AuthCaptchaMode,
  PRODUCTION_RUNTIME_ENVIRONMENTS,
  RUNTIME_ENVIRONMENT_LIST,
  RUNTIME_ENVIRONMENTS,
  type RuntimeEnvironment,
} from "./constants";

type CaptchaMode = AuthCaptchaMode;
type CaptchaRuntimeEnvironment = RuntimeEnvironment;

type AuthCaptchaClientConfig = {
  mode: CaptchaMode;
  required: boolean;
  siteKey: string | null;
  enabled: boolean;
};

const KNOWN_CAPTCHA_MODES = new Set<CaptchaMode>(AUTH_CAPTCHA_MODE_LIST);

const normalizeEnvValue = (value?: string | null): string | null => {
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
};

const normalizeRuntimeEnvironment = (
  value?: string | null,
): CaptchaRuntimeEnvironment | null => {
  const normalized = normalizeEnvValue(value);
  if (!normalized) {
    return null;
  }

  if (
    RUNTIME_ENVIRONMENT_LIST.includes(normalized as CaptchaRuntimeEnvironment)
  ) {
    return normalized as CaptchaRuntimeEnvironment;
  }

  return null;
};

const normalizeCaptchaMode = (value?: string | null): CaptchaMode | null => {
  const normalized = normalizeEnvValue(value);
  if (!normalized) {
    return null;
  }

  if (KNOWN_CAPTCHA_MODES.has(normalized as CaptchaMode)) {
    return normalized as CaptchaMode;
  }

  return null;
};

const resolveAuthCaptchaRuntimeEnvironment = (): CaptchaRuntimeEnvironment => {
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

const resolveClientAuthCaptchaMode = (): CaptchaMode => {
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
};

const getTurnstileSiteKey = (): string | null => {
  const value = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
  return value ? value : null;
};

const resolveAuthCaptchaClientConfig = (): AuthCaptchaClientConfig => {
  const mode = resolveClientAuthCaptchaMode();
  const siteKey = getTurnstileSiteKey();

  return {
    mode,
    required: mode === AUTH_CAPTCHA_MODES.required,
    siteKey,
    enabled: mode !== AUTH_CAPTCHA_MODES.off && Boolean(siteKey),
  };
};

export type {
  AuthCaptchaClientConfig,
  CaptchaMode as AuthCaptchaMode,
  CaptchaRuntimeEnvironment as RuntimeEnvironment,
};
export {
  getTurnstileSiteKey,
  resolveAuthCaptchaClientConfig,
  resolveAuthCaptchaRuntimeEnvironment,
  resolveClientAuthCaptchaMode,
};
