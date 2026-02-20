import { apiRequest, unwrapApiResponse } from "@/lib/client/api";
import type { ClientSession } from "@/lib/client/session";
import type { NotificationEntry } from "@/features/notifications/types";

type GetNotificationsQueryOptions = {
  limit?: number;
};

const getNotificationsQuery = async (
  session: ClientSession,
  options?: GetNotificationsQueryOptions,
): Promise<NotificationEntry[]> => {
  const limit = options?.limit ?? 100;
  const params = new URLSearchParams();
  params.set("limit", String(limit));

  const response = await apiRequest<NotificationEntry[]>(
    `/api/notifications?${params.toString()}`,
    {
      session,
    },
  );
  return unwrapApiResponse(response, "Failed to load notifications");
};

export { getNotificationsQuery as default, getNotificationsQuery };
