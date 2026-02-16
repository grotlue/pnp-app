import { requireAuth } from "@/server/auth/require-auth";
import { validatePasswordStrength } from "@/lib/api/auth-validation";
import { parseJsonBody, jsonError, jsonOk } from "@/lib/api/http";

type UpdatePasswordBody = {
  newPassword?: string;
};

export async function PATCH(request: Request) {
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

  const { data, error } = await auth.context.authClient.auth.updateUser({
    password: body.newPassword,
  });

  if (error) {
    return jsonError(400, "password_update_failed", error.message);
  }

  return jsonOk({ user: data.user });
}
