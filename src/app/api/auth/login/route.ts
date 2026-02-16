import { parseJsonBody, jsonError, jsonOk } from "@/lib/api/http";
import { hasRequiredFields } from "@/lib/api/validation";
import { setSessionCookies } from "@/server/auth/session-cookie";
import { enforceRateLimit } from "@/server/rate-limit/enforce-rate-limit";
import { createServerSupabaseClient } from "@/server/supabase/server-client";

type LoginBody = {
  email?: string;
  password?: string;
};

export async function POST(request: Request) {
  const rateLimited = await enforceRateLimit({
    request,
    route: "auth:login",
    limit: 10,
    windowMs: 5 * 60_000,
  });
  if (rateLimited) {
    return rateLimited;
  }

  const body = await parseJsonBody<LoginBody>(request);
  if (!hasRequiredFields(body, ["email", "password"])) {
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

  const { data: profile } = await client
    .from("profiles")
    .select("locale")
    .eq("id", data.user.id)
    .single();

  return setSessionCookies(
    jsonOk({
      user: data.user,
      locale: profile?.locale === "de" ? "de" : "en",
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
}
