import { parseJsonBody, jsonError, jsonOk } from "@/lib/api/http";
import { resolveSafeRedirectUrl } from "@/lib/api/security";
import { hasRequiredFields } from "@/lib/api/validation";
import { enforceRateLimit } from "@/server/rate-limit/enforce-rate-limit";
import { createServerSupabaseClient } from "@/server/supabase/server-client";

type ResendVerificationBody = {
  email?: string;
};

export async function POST(request: Request) {
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

  const client = createServerSupabaseClient();
  const redirectTo = resolveSafeRedirectUrl(request, "/auth/callback");

  const { error } = await client.auth.resend({
    type: "signup",
    email: body.email,
    options: {
      emailRedirectTo: redirectTo,
    },
  });

  if (error) {
    return jsonError(400, "email_resend_failed", error.message);
  }

  return jsonOk({ sent: true });
}
