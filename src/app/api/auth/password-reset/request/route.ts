import { parseJsonBody, jsonError, jsonOk } from "@/lib/api/http";
import { createServerSupabaseClient } from "@/server/supabase/server-client";

type PasswordResetRequestBody = {
  email?: string;
};

export async function POST(request: Request) {
  const body = await parseJsonBody<PasswordResetRequestBody>(request);
  if (!body?.email) {
    return jsonError(400, "invalid_payload", "email is required");
  }

  const client = createServerSupabaseClient();
  const redirectTo = request.headers.get("origin")
    ? `${request.headers.get("origin")}/auth/reset-password`
    : undefined;

  const { error } = await client.auth.resetPasswordForEmail(body.email, {
    redirectTo,
  });

  if (error) {
    return jsonError(400, "password_reset_request_failed", error.message);
  }

  return jsonOk({ requested: true });
}
