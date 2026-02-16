import { requireAuth } from "@/server/auth/require-auth";
import { normalizeAndValidateEmail } from "@/lib/api/auth-validation";
import { parseJsonBody, jsonError, jsonOk } from "@/lib/api/http";

type UpdateEmailBody = {
  newEmail?: string;
};

export async function PATCH(request: Request) {
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

  const { data, error } = await auth.context.authClient.auth.updateUser({
    email,
  });

  if (error) {
    return jsonError(400, "email_update_failed", error.message);
  }

  return jsonOk({ user: data.user });
}
