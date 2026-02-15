import { parseJsonBody, jsonError, jsonOk } from "@/lib/api/http";
import { createServerSupabaseClient } from "@/server/supabase/server-client";

type LoginBody = {
  email?: string;
  password?: string;
};

export async function POST(request: Request) {
  const body = await parseJsonBody<LoginBody>(request);
  if (!body?.email || !body.password) {
    return jsonError(400, "invalid_payload", "email and password are required");
  }

  const client = createServerSupabaseClient();
  const { data, error } = await client.auth.signInWithPassword({
    email: body.email,
    password: body.password,
  });

  if (error || !data.session) {
    return jsonError(401, "login_failed", error?.message ?? "login failed");
  }

  return jsonOk({
    user: data.user,
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    expiresAt: data.session.expires_at,
  });
}
