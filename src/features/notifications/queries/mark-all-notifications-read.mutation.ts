import { apiRequest, unwrapApiResponse } from "@/lib/client/api";
import type { ClientSession } from "@/lib/client/session";

type MarkAllNotificationsReadResponse = {
  readAll: true;
  updated: number;
};

export async function markAllNotificationsReadMutation(
  session: ClientSession,
): Promise<MarkAllNotificationsReadResponse> {
  const response = await apiRequest<MarkAllNotificationsReadResponse>(
    "/api/notifications/read-all",
    {
      method: "POST",
      session,
    },
  );
  return unwrapApiResponse(
    response,
    "Failed to mark all notifications as read",
  );
}
