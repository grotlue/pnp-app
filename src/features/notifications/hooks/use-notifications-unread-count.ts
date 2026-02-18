"use client";

import { useQuery } from "@tanstack/react-query";
import type { ClientSession } from "@/lib/client/session";
import { getNotificationsUnreadCountQuery } from "@/features/notifications/queries/get-notifications-unread-count.query";

export const notificationsUnreadCountQueryKey = [
  "notifications",
  "unread-count",
] as const;

export function useNotificationsUnreadCount(session: ClientSession | null) {
  return useQuery({
    queryKey: [
      ...notificationsUnreadCountQueryKey,
      session?.accessToken ?? "no-session",
    ],
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
}
