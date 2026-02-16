"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/client/query-keys";
import type { ClientSession } from "@/lib/client/session";
import { getMe } from "@/features/users/queries/users-profile.query";

export function useMeQuery(session: ClientSession | null) {
  const token = session?.accessToken ?? "no-session";

  return useQuery({
    queryKey: queryKeys.me(token),
    enabled: Boolean(session),
    staleTime: 60_000,
    queryFn: async () => {
      if (!session) {
        throw new Error("Missing session");
      }
      return getMe(session);
    },
  });
}
