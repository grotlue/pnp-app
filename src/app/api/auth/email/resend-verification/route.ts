import { parseJsonBody, jsonError, jsonOk } from "@/lib/api/http";
import { createServerSupabaseClient } from "@/server/supabase/server-client";

type ResendVerificationBody = {
  email?: string;
};

export async function POST(request: Request) {
  const body = await parseJsonBody<ResendVerificationBody>(request);
  if (!body?.email) {
    return jsonError(400, "invalid_payload", "email is required");
  }

  const client = createServerSupabaseClient();
  const redirectTo = request.headers.get("origin")
    ? `${request.headers.get("origin")}/auth/callback`
    : undefined;

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
