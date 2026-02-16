import { requireAuth } from "@/server/auth/require-auth";
import { jsonError, jsonOk } from "@/lib/api/http";

export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if ("response" in auth) {
    return auth.response;
  }

  const { client, user } = auth.context;
  const { data: profile, error } = await client
    .from("profiles")
    .select("id, username, description, avatar_path, role, locale, created_at, updated_at")
    .eq("id", user.id)
    .single();

  if (error) {
    return jsonError(500, "profile_fetch_failed", error.message);
  }

  return jsonOk({ user, profile });
}

export async function DELETE(request: Request) {
  const auth = await requireAuth(request);
  if ("response" in auth) {
    return auth.response;
  }

  const { client, user } = auth.context;
  const { error } = await client.rpc("rpc_delete_user_phase1", {
      p_user_id: user.id,
    });

  if (error) {
    return jsonError(400, "user_delete_failed", error.message);
  }

  return jsonOk({ deleted: true });
}
