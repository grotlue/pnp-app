import { apiRequest, unwrapApiResponse } from "@/lib/client/api";
import type { ClientSession } from "@/lib/client/session";

export async function markNotificationReadMutation(
  session: ClientSession,
  notificationId: string,
): Promise<{ read: true }> {
  const response = await apiRequest<{ read: true }>(
    `/api/notifications/${notificationId}/read`,
    {
      method: "POST",
      session,
    },
  );
  return unwrapApiResponse(response, "Failed to mark notification as read");
}
