import { requireAuth } from "@/server/auth/require-auth";
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

  const { data, error } = await auth.context.client.auth.updateUser({
    email: body.newEmail,
  });

  if (error) {
    return jsonError(400, "email_update_failed", error.message);
  }

  return jsonOk({ user: data.user });
}
