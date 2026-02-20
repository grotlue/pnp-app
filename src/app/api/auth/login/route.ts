import { jsonError, jsonOk, parseJsonBody } from "@/lib/api/http";
import {
  normalizeAndValidateEmail,
  normalizeCaptchaToken,
} from "@/lib/api/auth-validation";
import { hasRequiredFields } from "@/lib/api/validation";
import { resolveRuntimeEnvironment } from "@/lib/features/feature-flags";
import { isCaptchaRequiredForAuth } from "@/server/auth/auth-hardening";
import { setSessionCookies } from "@/server/auth/session-cookie";
import { enforceRateLimit } from "@/server/rate-limit/enforce-rate-limit";
import { createServerSupabaseClient } from "@/server/supabase/server-client";

type LoginBody = {
  email?: string;
  password?: string;
  captchaToken?: string;
};

const POST = async (request: Request) => {
  const runtimeEnvironment = resolveRuntimeEnvironment();
  const loginRateLimit =
    runtimeEnvironment === "preview" || runtimeEnvironment === "production"
      ? 10
      : 50;

  const rateLimited = await enforceRateLimit({
    request,
    route: "auth:login",
    limit: loginRateLimit,
    windowMs: 5 * 60_000,
  });
  if (rateLimited) {
    return rateLimited;
  }

  const body = await parseJsonBody<LoginBody>(request);
  if (!hasRequiredFields(body, ["email", "password"])) {
    return jsonError(400, "invalid_payload", "email and password are required");
  }
  const email = normalizeAndValidateEmail(body.email);
  if (!email) {
    return jsonError(400, "invalid_payload", "valid email is required");
  }
  const captchaToken = normalizeCaptchaToken(body.captchaToken);
  if (isCaptchaRequiredForAuth() && !captchaToken) {
    return jsonError(400, "invalid_payload", "captchaToken is required");
  }

  const client = createServerSupabaseClient();
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password: body.password,
    options: captchaToken ? { captchaToken } : undefined,
  });

  if (error || !data.session) {
    return jsonError(401, "login_failed", error?.message ?? "login failed");
  }

  const { data: profile } = await client
    .from("profiles")
    .select("locale")
    .eq("id", data.user.id)
    .single();

  return setSessionCookies(
    jsonOk({
      user: data.user,
      locale: profile?.locale === "de" ? "de" : "en",
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: data.session.expires_at,
    }),
    {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: data.session.expires_at,
    },
  );
};

export { POST };
