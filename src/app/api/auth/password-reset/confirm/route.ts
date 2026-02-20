import { jsonError, jsonOk, parseJsonBody } from "@/lib/api/http";
import { validatePasswordStrength } from "@/lib/api/auth-validation";
import { setSessionCookies } from "@/server/auth/session-cookie";
import { enforceRateLimit } from "@/server/rate-limit/enforce-rate-limit";
import { createServiceRoleSupabaseClient } from "@/server/supabase/service-role-client";
import { createServerSupabaseClient } from "@/server/supabase/server-client";

type PasswordResetConfirmBody = {
  accessToken?: string;
  refreshToken?: string;
  newPassword?: string;
};

const POST = async (request: Request) => {
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

  if (sessionError || !sessionData.session || !sessionData.user) {
    return jsonError(
      400,
      "invalid_reset_session",
      sessionError?.message ?? "invalid reset session",
    );
  }

  let passwordResetError: string | null = null;
  try {
    const service = createServiceRoleSupabaseClient();
    const { error } = await service.auth.admin.updateUserById(
      sessionData.user.id,
      {
        password: body.newPassword,
      },
    );
    if (error) {
      passwordResetError = error.message;
    }
  } catch {
    const { error } = await client.auth.updateUser({
      password: body.newPassword,
    });
    if (error) {
      passwordResetError = error.message;
    }
  }

  if (passwordResetError) {
    return jsonError(400, "password_reset_confirm_failed", passwordResetError);
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
};

export { POST };
