import { requireAuth } from "@/server/auth/require-auth";
import { validatePasswordStrength } from "@/lib/api/auth-validation";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api/http";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/config";

type UpdatePasswordBody = {
  newPassword?: string;
};

const PATCH = async (request: Request) => {
  const auth = await requireAuth(request);
  if ("response" in auth) {
    return auth.response;
  }

  const body = await parseJsonBody<UpdatePasswordBody>(request);
  if (!body?.newPassword) {
    return jsonError(400, "invalid_payload", "newPassword is required");
  }
  const passwordError = validatePasswordStrength(body.newPassword);
  if (passwordError) {
    return jsonError(400, "invalid_payload", passwordError);
  }

  const response = await fetch(`${getSupabaseUrl()}/auth/v1/user`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      apikey: getSupabaseAnonKey(),
      Authorization: `Bearer ${auth.context.accessToken}`,
    },
    body: JSON.stringify({ password: body.newPassword }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      msg?: string;
      error?: string;
      error_description?: string;
    } | null;

    return jsonError(
      400,
      "password_update_failed",
      payload?.msg ??
        payload?.error_description ??
        payload?.error ??
        "Failed to update password",
    );
  }

  const user = await response.json().catch(() => null);
  return jsonOk({ user });
};

export { PATCH };
