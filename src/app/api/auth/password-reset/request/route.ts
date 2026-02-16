import { parseJsonBody, jsonError, jsonOk } from "@/lib/api/http";
import {
  normalizeAndValidateEmail,
  normalizeCaptchaToken,
} from "@/lib/api/auth-validation";
import { resolveSafeRedirectUrl } from "@/lib/api/security";
import { hasRequiredFields } from "@/lib/api/validation";
import { isCaptchaRequiredForAuth } from "@/server/auth/auth-hardening";
import { enforceRateLimit } from "@/server/rate-limit/enforce-rate-limit";
import { createServerSupabaseClient } from "@/server/supabase/server-client";

type PasswordResetRequestBody = {
  email?: string;
  captchaToken?: string;
};

export async function POST(request: Request) {
  const rateLimited = await enforceRateLimit({
    request,
    route: "auth:password-reset:request",
    limit: 5,
    windowMs: 15 * 60_000,
  });
  if (rateLimited) {
    return rateLimited;
  }

  const body = await parseJsonBody<PasswordResetRequestBody>(request);
  if (!hasRequiredFields(body, ["email"])) {
    return jsonError(400, "invalid_payload", "email is required");
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
  const redirectTo = resolveSafeRedirectUrl(request, "/auth/reset-password");

  const { error } = await client.auth.resetPasswordForEmail(email, {
    redirectTo,
    ...(captchaToken ? { captchaToken } : {}),
  });

  if (error) {
    return jsonError(400, "password_reset_request_failed", error.message);
  }

  return jsonOk({ requested: true });
}
