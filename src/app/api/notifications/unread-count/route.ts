import { requireAuth } from "@/server/auth/require-auth";
import { jsonError, jsonOk } from "@/lib/api/http";
import { countUnreadNotificationsRpcQuery } from "@/features/notifications/queries/count-unread-notifications-rpc.query";

export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if ("response" in auth) {
    return auth.response;
  }

  try {
    const unreadCount = await countUnreadNotificationsRpcQuery(
      auth.context.client,
    );
    return jsonOk({ unreadCount });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonError(400, "notifications_unread_count_failed", message);
  }
}
