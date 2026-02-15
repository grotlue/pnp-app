import { parseJsonBody, jsonError, jsonOk } from "@/lib/api/http";
import { createServerSupabaseClient } from "@/server/supabase/server-client";

type ExchangeBody = {
  code?: string;
};

export async function POST(request: Request) {
  const body = await parseJsonBody<ExchangeBody>(request);
  if (!body?.code) {
    return jsonError(400, "invalid_payload", "code is required");
  }

  const client = createServerSupabaseClient();
  const { data, error } = await client.auth.exchangeCodeForSession(body.code);

  if (error || !data.session) {
    return jsonError(400, "auth_code_exchange_failed", error?.message ?? "auth code exchange failed");
  }

  return jsonOk({
    user: data.user,
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    expiresAt: data.session.expires_at,
  });
}
