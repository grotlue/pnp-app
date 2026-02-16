"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/client/query-keys";
import type { ClientSession } from "@/lib/client/session";
import { getMe } from "@/features/users/queries/users-profile.query";

type UseMeQueryOptions = {
  enabled?: boolean;
};

export function useMeQuery(session: ClientSession | null, options?: UseMeQueryOptions) {
  const token = session?.accessToken ?? "no-session";
  const enabled = options?.enabled ?? true;

  return useQuery({
    queryKey: queryKeys.me(token),
    enabled: Boolean(session) && enabled,
    staleTime: 60_000,
    queryFn: async () => {
      if (!session) {
        throw new Error("Missing session");
      }
      return getMe(session);
    },
  });
}
