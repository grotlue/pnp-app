import { apiRequest, unwrapApiResponse } from "@/lib/client/api";
import type { ClientSession } from "@/lib/client/session";

export async function getNotificationsUnreadCountQuery(
  session: ClientSession,
): Promise<{ unreadCount: number }> {
  const response = await apiRequest<{ unreadCount: number }>("/api/notifications/unread-count", {
    session,
  });
  return unwrapApiResponse(response, "Failed to load unread notification count");
}
