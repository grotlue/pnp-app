import { jsonError, jsonOk, parseJsonBody } from "@/lib/api/http";
import {
  normalizeAndValidateEmail,
  normalizeCaptchaToken,
  validatePasswordStrength,
} from "@/lib/api/auth-validation";
import { resolveSafeRedirectUrl } from "@/lib/api/security";
import { hasRequiredFields } from "@/lib/api/validation";
import { isFeatureEnabled } from "@/lib/features/feature-flags";
import { detectLocaleFromAcceptLanguage } from "@/lib/i18n";
import {
  isCaptchaRequiredForAuth,
  isPreviewAuthEmailDeliveryDisabled,
} from "@/server/auth/auth-hardening";
import { setSessionCookies } from "@/server/auth/session-cookie";
import { enforceRateLimit } from "@/server/rate-limit/enforce-rate-limit";
import { createServiceRoleSupabaseClient } from "@/server/supabase/service-role-client";
import { createServerSupabaseClient } from "@/server/supabase/server-client";

type RegisterBody = {
  email?: string;
  password?: string;
  username?: string;
  locale?: "en" | "de";
  captchaToken?: string;
};

const POST = async (request: Request) => {
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
  const email = normalizeAndValidateEmail(body.email);
  if (!email) {
    return jsonError(400, "invalid_payload", "valid email is required");
  }
  const passwordError = validatePasswordStrength(body.password);
  if (passwordError) {
    return jsonError(400, "invalid_payload", passwordError);
  }
  const captchaToken = normalizeCaptchaToken(body.captchaToken);
  if (isCaptchaRequiredForAuth() && !captchaToken) {
    return jsonError(400, "invalid_payload", "captchaToken is required");
  }

  const signupLocale =
    body.locale ??
    detectLocaleFromAcceptLanguage(request.headers.get("accept-language"));

  if (isPreviewAuthEmailDeliveryDisabled()) {
    const serviceClient = createServiceRoleSupabaseClient();
    const { error: createError } = await serviceClient.auth.admin.createUser({
      email,
      password: body.password,
      email_confirm: true,
      user_metadata: {
        username: body.username,
        locale: signupLocale,
      },
    });
    if (createError) {
      return jsonError(400, "register_failed", createError.message);
    }

    const client = createServerSupabaseClient();
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password: body.password,
    });
    if (error || !data.session) {
      return jsonError(
        400,
        "register_failed",
        error?.message ?? "Sign-in failed",
      );
    }

    const response = jsonOk(
      {
        user: data.user,
        session: data.session,
        emailVerificationRequired: false,
      },
      201,
    );

    return setSessionCookies(response, {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: data.session.expires_at,
    });
  }

  const client = createServerSupabaseClient();
  const redirectTo = resolveSafeRedirectUrl(request, "/auth/confirm?next=/");

  const { data, error } = await client.auth.signUp({
    email,
    password: body.password,
    options: {
      emailRedirectTo: redirectTo,
      ...(captchaToken ? { captchaToken } : {}),
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
};

export { POST };
