"use client";

import { useQuery } from "@tanstack/react-query";
import type { ClientSession } from "@/lib/client/session";
import { queryKeys } from "@/lib/client/query-keys";
import { getNotificationsUnreadCountQuery } from "@/features/notifications/queries/get-notifications-unread-count.query";

const useNotificationsUnreadCount = (session: ClientSession | null) => {
  const token = session?.accessToken ?? "no-session";

  return useQuery({
    queryKey: queryKeys.notificationsUnreadCount(token),
    enabled: Boolean(session),
    staleTime: 30_000,
    refetchOnMount: false,
    queryFn: async () => {
      if (!session) {
        throw new Error("Missing session");
      }
      return getNotificationsUnreadCountQuery(session);
    },
    refetchInterval: 30_000,
  });
};

export { useNotificationsUnreadCount as default, useNotificationsUnreadCount };
