"use client";

import { useQuery } from "@tanstack/react-query";
import type { ClientSession } from "@/lib/client/session";
import { getNotificationsQuery } from "@/features/notifications/queries/get-notifications.query";

export const notificationsQueryKey = ["notifications", "list"] as const;

type UseNotificationsQueryOptions = {
  limit?: number;
};

export function useNotificationsQuery(
  session: ClientSession | null,
  options?: UseNotificationsQueryOptions,
) {
  const limit = options?.limit ?? 100;

  return useQuery({
    queryKey: [...notificationsQueryKey, session?.accessToken ?? "no-session", limit],
    enabled: Boolean(session),
    queryFn: async () => {
      if (!session) {
        throw new Error("Missing session");
      }
      return getNotificationsQuery(session, { limit });
    },
    refetchInterval: 15_000,
  });
}
