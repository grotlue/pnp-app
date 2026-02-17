import { requireAuth } from "@/server/auth/require-auth";
import { jsonError, jsonOk } from "@/lib/api/http";

export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if ("response" in auth) {
    return auth.response;
  }

  const { count, error } = await auth.context.client
    .from("notifications")
    .select("id", { head: true, count: "exact" })
    .eq("recipient_user_id", auth.context.user.id)
    .eq("is_read", false);

  if (error) {
    return jsonError(400, "notifications_unread_count_failed", error.message);
  }

  return jsonOk({ unreadCount: count ?? 0 });
}
