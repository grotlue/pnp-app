import { parseJsonBody, jsonError, jsonOk } from "@/lib/api/http";
import { resolveSafeRedirectUrl } from "@/lib/api/security";
import { hasRequiredFields } from "@/lib/api/validation";
import { isFeatureEnabled } from "@/lib/features/feature-flags";
import { detectLocaleFromAcceptLanguage } from "@/lib/i18n";
import { setSessionCookies } from "@/server/auth/session-cookie";
import { enforceRateLimit } from "@/server/rate-limit/enforce-rate-limit";
import { createServerSupabaseClient } from "@/server/supabase/server-client";

type RegisterBody = {
  email?: string;
  password?: string;
  username?: string;
  locale?: "en" | "de";
};

export async function POST(request: Request) {
  const rateLimited = await enforceRateLimit({
    request,
    route: "auth:register",
    limit: 5,
    windowMs: 15 * 60_000,
  });
  if (rateLimited) {
    return rateLimited;
  }

  if (!(await isFeatureEnabled("selfRegistration"))) {
    return jsonError(404, "not_found", "Not Found");
  }

  const body = await parseJsonBody<RegisterBody>(request);
  if (!hasRequiredFields(body, ["email", "password"])) {
    return jsonError(400, "invalid_payload", "email and password are required");
  }
  const signupLocale =
    body.locale ?? detectLocaleFromAcceptLanguage(request.headers.get("accept-language"));

  const client = createServerSupabaseClient();
  const redirectTo = resolveSafeRedirectUrl(request, "/auth/callback");

  const { data, error } = await client.auth.signUp({
    email: body.email,
    password: body.password,
    options: {
      emailRedirectTo: redirectTo,
      data: {
        username: body.username,
        locale: signupLocale,
      },
    },
  });

  if (error) {
    return jsonError(400, "register_failed", error.message);
  }

  const response = jsonOk(
    {
      user: data.user,
      session: data.session,
      emailVerificationRequired: data.session === null,
    },
    201,
  );

  if (!data.session) {
    return response;
  }

  return setSessionCookies(response, {
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    expiresAt: data.session.expires_at,
  });
}
