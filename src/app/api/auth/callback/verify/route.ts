import { jsonError, jsonOk, parseJsonBody } from "@/lib/api/http";
import { setSessionCookies } from "@/server/auth/session-cookie";
import { enforceRateLimit } from "@/server/rate-limit/enforce-rate-limit";
import { createServerSupabaseClient } from "@/server/supabase/server-client";

type VerifyType = "signup" | "recovery" | "email" | "email_change";

type VerifyBody = {
  tokenHash?: string;
  type?: VerifyType;
};

const validTypes = new Set<VerifyType>([
  "signup",
  "recovery",
  "email",
  "email_change",
]);

const POST = async (request: Request) => {
  const rateLimited = await enforceRateLimit({
    request,
    route: "auth:callback:verify",
    limit: 20,
    windowMs: 10 * 60_000,
  });
  if (rateLimited) {
    return rateLimited;
  }

  const body = await parseJsonBody<VerifyBody>(request);
  if (!body?.tokenHash || !body.type || !validTypes.has(body.type)) {
    return jsonError(
      400,
      "invalid_payload",
      "tokenHash and valid type are required",
    );
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

  return setSessionCookies(
    jsonOk({
      verified: true,
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
