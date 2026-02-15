import { parseJsonBody, jsonError, jsonOk } from "@/lib/api/http";
import { isFeatureEnabled } from "@/lib/features/feature-flags";
import { detectLocaleFromAcceptLanguage } from "@/lib/i18n";
import { createServerSupabaseClient } from "@/server/supabase/server-client";

type RegisterBody = {
  email?: string;
  password?: string;
  username?: string;
  locale?: "en" | "de";
};

export async function POST(request: Request) {
  if (!(await isFeatureEnabled("selfRegistration"))) {
    return jsonError(404, "not_found", "Not Found");
  }

  const body = await parseJsonBody<RegisterBody>(request);
  if (!body?.email || !body.password) {
    return jsonError(400, "invalid_payload", "email and password are required");
  }
  const signupLocale =
    body.locale ?? detectLocaleFromAcceptLanguage(request.headers.get("accept-language"));

  const client = createServerSupabaseClient();
  const redirectTo = request.headers.get("origin")
    ? `${request.headers.get("origin")}/auth/callback`
    : undefined;

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

  return jsonOk({
    user: data.user,
    session: data.session,
    emailVerificationRequired: data.session === null,
  }, 201);
}
