import { jsonError, jsonOk, parseJsonBody } from "@/lib/api/http";
import {
  normalizeAndValidateEmail,
  normalizeCaptchaToken,
} from "@/lib/api/auth-validation";
import { resolveSafeRedirectUrl } from "@/lib/api/security";
import { hasRequiredFields } from "@/lib/api/validation";
import {
  isCaptchaRequiredForAuth,
  isPreviewAuthEmailDeliveryDisabled,
} from "@/server/auth/auth-hardening";
import { enforceRateLimit } from "@/server/rate-limit/enforce-rate-limit";
import { createServerSupabaseClient } from "@/server/supabase/server-client";

type ResendVerificationBody = {
  email?: string;
  captchaToken?: string;
};

const POST = async (request: Request) => {
  const rateLimited = await enforceRateLimit({
    request,
    route: "auth:email:resend-verification",
    limit: 5,
    windowMs: 15 * 60_000,
  });
  if (rateLimited) {
    return rateLimited;
  }

  const body = await parseJsonBody<ResendVerificationBody>(request);
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
  const redirectTo = resolveSafeRedirectUrl(request, "/auth/confirm?next=/");

  if (isPreviewAuthEmailDeliveryDisabled()) {
    return jsonOk({ sent: true });
  }

  const { error } = await client.auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo: redirectTo,
      ...(captchaToken ? { captchaToken } : {}),
    },
  });

  if (error) {
    return jsonError(400, "email_resend_failed", error.message);
  }

  return jsonOk({ sent: true });
};

export { POST };
