"use client";

import { useQuery } from "@tanstack/react-query";
import type { ClientSession } from "@/lib/client/session";
import { queryKeys } from "@/lib/client/query-keys";
import { getNotificationsQuery } from "@/features/notifications/queries/get-notifications.query";

type UseNotificationsQueryOptions = {
  limit?: number;
};

export function useNotificationsQuery(
  session: ClientSession | null,
  options?: UseNotificationsQueryOptions,
) {
  const limit = options?.limit ?? 100;
  const token = session?.accessToken ?? "no-session";

  return useQuery({
    queryKey: queryKeys.notificationsList(token, limit),
    enabled: Boolean(session),
    queryFn: async () => {
      if (!session) {
        throw new Error("Missing session");
      }
      return getNotificationsQuery(session, { limit });
    },
  });
}
