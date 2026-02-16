import { parseJsonBody, jsonError, jsonOk } from "@/lib/api/http";
import { resolveSafeRedirectUrl } from "@/lib/api/security";
import { hasRequiredFields } from "@/lib/api/validation";
import { enforceRateLimit } from "@/server/rate-limit/enforce-rate-limit";
import { createServerSupabaseClient } from "@/server/supabase/server-client";

type PasswordResetRequestBody = {
  email?: string;
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

  const client = createServerSupabaseClient();
  const redirectTo = resolveSafeRedirectUrl(request, "/auth/reset-password");

  const { error } = await client.auth.resetPasswordForEmail(body.email, {
    redirectTo,
  });

  if (error) {
    return jsonError(400, "password_reset_request_failed", error.message);
  }

  return jsonOk({ requested: true });
}
