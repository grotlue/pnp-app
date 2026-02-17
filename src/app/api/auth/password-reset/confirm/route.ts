import { parseJsonBody, jsonError, jsonOk } from "@/lib/api/http";
import { validatePasswordStrength } from "@/lib/api/auth-validation";
import { setSessionCookies } from "@/server/auth/session-cookie";
import { enforceRateLimit } from "@/server/rate-limit/enforce-rate-limit";
import { createServerSupabaseClient } from "@/server/supabase/server-client";

type PasswordResetConfirmBody = {
  accessToken?: string;
  refreshToken?: string;
  newPassword?: string;
};

export async function POST(request: Request) {
  const rateLimited = await enforceRateLimit({
    request,
    route: "auth:password-reset:confirm",
    limit: 10,
    windowMs: 15 * 60_000,
  });
  if (rateLimited) {
    return rateLimited;
  }

  const body = await parseJsonBody<PasswordResetConfirmBody>(request);
  if (!body?.accessToken || !body.refreshToken || !body.newPassword) {
    return jsonError(
      400,
      "invalid_payload",
      "accessToken, refreshToken, and newPassword are required",
    );
  }
  const passwordError = validatePasswordStrength(body.newPassword);
  if (passwordError) {
    return jsonError(400, "invalid_payload", passwordError);
  }

  const client = createServerSupabaseClient();
  const { data: sessionData, error: sessionError } =
    await client.auth.setSession({
      access_token: body.accessToken,
      refresh_token: body.refreshToken,
    });

  if (sessionError || !sessionData.session) {
    return jsonError(
      400,
      "invalid_reset_session",
      sessionError?.message ?? "invalid reset session",
    );
  }

  const { error } = await client.auth.updateUser({
    password: body.newPassword,
  });

  if (error) {
    return jsonError(400, "password_reset_confirm_failed", error.message);
  }

  return setSessionCookies(
    jsonOk({
      updated: true,
      accessToken: sessionData.session.access_token,
      refreshToken: sessionData.session.refresh_token,
      expiresAt: sessionData.session.expires_at,
    }),
    {
      accessToken: sessionData.session.access_token,
      refreshToken: sessionData.session.refresh_token,
      expiresAt: sessionData.session.expires_at,
    },
  );
}
