import { requireAuth } from "@/server/auth/require-auth";
import { parseJsonBody, jsonError, jsonOk } from "@/lib/api/http";

type UpdateProfileBody = {
  username?: string;
  description?: string;
  avatarPath?: string | null;
  locale?: "en" | "de";
};

export async function PATCH(request: Request) {
  const auth = await requireAuth(request);
  if ("response" in auth) {
    return auth.response;
  }

  const body = await parseJsonBody<UpdateProfileBody>(request);
  if (!body) {
    return jsonError(400, "invalid_payload", "invalid JSON body");
  }

  const patch: Record<string, unknown> = {};
  if (body.username !== undefined) {
    patch.username = body.username;
  }
  if (body.description !== undefined) {
    patch.description = body.description;
  }
  if (body.avatarPath !== undefined) {
    patch.avatar_path = body.avatarPath;
  }
  if (body.locale !== undefined) {
    patch.locale = body.locale;
  }

  const { data, error } = await auth.context.client
    .from("profiles")
    .update(patch)
    .eq("id", auth.context.user.id)
    .select(
      "id, username, description, avatar_path, role, locale, created_at, updated_at",
    )
    .single();

  if (error) {
    return jsonError(400, "profile_update_failed", error.message);
  }

  return jsonOk(data);
}
