import { requireAuth } from "@/server/auth/require-auth";
import { normalizeAndValidateEmail } from "@/lib/api/auth-validation";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api/http";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/config";

type UpdateEmailBody = {
  newEmail?: string;
};

const PATCH = async (request: Request) => {
  const auth = await requireAuth(request);
  if ("response" in auth) {
    return auth.response;
  }

  const body = await parseJsonBody<UpdateEmailBody>(request);
  if (!body?.newEmail) {
    return jsonError(400, "invalid_payload", "newEmail is required");
  }
  const email = normalizeAndValidateEmail(body.newEmail);
  if (!email) {
    return jsonError(400, "invalid_payload", "valid newEmail is required");
  }

  const response = await fetch(`${getSupabaseUrl()}/auth/v1/user`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      apikey: getSupabaseAnonKey(),
      Authorization: `Bearer ${auth.context.accessToken}`,
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      msg?: string;
      error?: string;
      error_description?: string;
    } | null;

    return jsonError(
      400,
      "email_update_failed",
      payload?.msg ??
        payload?.error_description ??
        payload?.error ??
        "Failed to update email",
    );
  }

  const user = await response.json().catch(() => null);
  return jsonOk({ user });
};

export { PATCH };
