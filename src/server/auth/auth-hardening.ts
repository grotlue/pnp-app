import { resolveRuntimeEnvironment } from "@/lib/features/feature-flags";
import {
  AUTH_CAPTCHA_MODE_LIST,
  AUTH_CAPTCHA_MODES,
  type AuthCaptchaMode,
  BOOLEAN_ENV_VALUES,
  PRODUCTION_RUNTIME_ENVIRONMENTS,
} from "@/lib/features/constants";

type CaptchaMode = AuthCaptchaMode;

const KNOWN_CAPTCHA_MODES = new Set<CaptchaMode>(AUTH_CAPTCHA_MODE_LIST);

const normalizeEnvValue = (value?: string): string | null => {
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

const parseBooleanEnv = (value?: string): boolean | null => {
  const normalized = normalizeEnvValue(value);
  if (!normalized) {
    return null;
  }

  if (normalized === BOOLEAN_ENV_VALUES.true) {
    return true;
  }
  if (normalized === BOOLEAN_ENV_VALUES.false) {
    return false;
  }
  return null;
};

const decodeAccessTokenPayload = (
  accessToken: string,
): Record<string, unknown> | null => {
  const parts = accessToken.split(".");
  if (parts.length < 2) {
    return null;
  }

  try {
    const decoded = Buffer.from(parts[1], "base64url").toString("utf8");
    const payload = JSON.parse(decoded);
    return payload && typeof payload === "object"
      ? (payload as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
};

const isAdminMfaRequired = (): boolean => {
  const override = parseBooleanEnv(process.env.REQUIRE_ADMIN_MFA);
  if (override !== null) {
    return override;
  }

  const environment = resolveRuntimeEnvironment();
  return environment === "preview" || environment === "production";
};

const resolveAuthCaptchaMode = (): CaptchaMode => {
  const rawMode = normalizeEnvValue(process.env.AUTH_CAPTCHA_MODE);
  if (rawMode && KNOWN_CAPTCHA_MODES.has(rawMode as CaptchaMode)) {
    return rawMode as CaptchaMode;
  }

  const environment = resolveRuntimeEnvironment();
  if (PRODUCTION_RUNTIME_ENVIRONMENTS.has(environment)) {
    return AUTH_CAPTCHA_MODES.optional;
  }

  return AUTH_CAPTCHA_MODES.off;
};

const isCaptchaRequiredForAuth = (): boolean => {
  return resolveAuthCaptchaMode() === AUTH_CAPTCHA_MODES.required;
};

const isPreviewAuthEmailDeliveryDisabled = (): boolean => {
  const override = parseBooleanEnv(process.env.PREVIEW_AUTH_EMAILS_DISABLED);
  if (override !== null) {
    return override;
  }

  return resolveRuntimeEnvironment() === "preview";
};

const hasAal2AuthLevel = (accessToken: string): boolean => {
  const payload = decodeAccessTokenPayload(accessToken);
  if (!payload) {
    return false;
  }

  return payload.aal === "aal2";
};

export type { CaptchaMode as AuthCaptchaMode };
export {
  hasAal2AuthLevel,
  isAdminMfaRequired,
  isCaptchaRequiredForAuth,
  isPreviewAuthEmailDeliveryDisabled,
  resolveAuthCaptchaMode,
};
