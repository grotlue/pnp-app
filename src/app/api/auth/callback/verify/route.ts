import { parseJsonBody, jsonError, jsonOk } from "@/lib/api/http";
import { createServerSupabaseClient } from "@/server/supabase/server-client";

type VerifyType = "signup" | "recovery" | "email" | "email_change";

type VerifyBody = {
  tokenHash?: string;
  type?: VerifyType;
};

const validTypes = new Set<VerifyType>(["signup", "recovery", "email", "email_change"]);

export async function POST(request: Request) {
  const body = await parseJsonBody<VerifyBody>(request);
  if (!body?.tokenHash || !body.type || !validTypes.has(body.type)) {
    return jsonError(400, "invalid_payload", "tokenHash and valid type are required");
  }

  const client = createServerSupabaseClient();
  const { data, error } = await client.auth.verifyOtp({
    token_hash: body.tokenHash,
    type: body.type,
  });

  if (error) {
    return jsonError(400, "auth_verify_failed", error.message);
  }

  if (!data.session) {
    return jsonOk({ verified: true });
  }

  return jsonOk({
    verified: true,
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    expiresAt: data.session.expires_at,
  });
}
