import { requireAuth } from "@/server/auth/require-auth";
import { jsonError, jsonOk } from "@/lib/api/http";

const POST = async (request: Request) => {
  const auth = await requireAuth(request);
  if ("response" in auth) {
    return auth.response;
  }

  const now = new Date().toISOString();
  const { data, error } = await auth.context.client
    .from("notifications")
    .update({
      is_read: true,
      read_at: now,
    })
    .eq("recipient_user_id", auth.context.user.id)
    .eq("is_read", false)
    .select("id");

  if (error) {
    return jsonError(400, "notifications_mark_all_read_failed", error.message);
  }

  return jsonOk({
    readAll: true,
    updated: data?.length ?? 0,
  });
};

export { POST };
