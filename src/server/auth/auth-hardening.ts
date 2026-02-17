import { resolveRuntimeEnvironment } from "@/lib/features/feature-flags";

export type AuthCaptchaMode = "off" | "optional" | "required";

const KNOWN_CAPTCHA_MODES = new Set<AuthCaptchaMode>([
  "off",
  "optional",
  "required",
]);

function normalizeEnvValue(value?: string): string | null {
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

function parseBooleanEnv(value?: string): boolean | null {
  const normalized = normalizeEnvValue(value);
  if (!normalized) {
    return null;
  }

  if (normalized === "true") {
    return true;
  }
  if (normalized === "false") {
    return false;
  }
  return null;
}

function decodeAccessTokenPayload(
  accessToken: string,
): Record<string, unknown> | null {
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
}

export function isAdminMfaRequired(): boolean {
  const override = parseBooleanEnv(process.env.REQUIRE_ADMIN_MFA);
  if (override !== null) {
    return override;
  }

  const environment = resolveRuntimeEnvironment();
  return environment === "preview" || environment === "production";
}

export function resolveAuthCaptchaMode(): AuthCaptchaMode {
  const rawMode = normalizeEnvValue(process.env.AUTH_CAPTCHA_MODE);
  if (rawMode && KNOWN_CAPTCHA_MODES.has(rawMode as AuthCaptchaMode)) {
    return rawMode as AuthCaptchaMode;
  }

  const environment = resolveRuntimeEnvironment();
  if (environment === "preview" || environment === "production") {
    return "optional";
  }

  return "off";
}

export function isCaptchaRequiredForAuth(): boolean {
  return resolveAuthCaptchaMode() === "required";
}

export function hasAal2AuthLevel(accessToken: string): boolean {
  const payload = decodeAccessTokenPayload(accessToken);
  if (!payload) {
    return false;
  }

  return payload.aal === "aal2";
}
