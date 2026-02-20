"use client";

import { useQuery } from "@tanstack/react-query";
import type { ClientSession } from "@/lib/client/session";
import { queryKeys } from "@/lib/client/query-keys";
import { getAdminMfaStatus } from "@/features/users/queries/users-mfa.query";

type UseAdminMfaStatusQueryOptions = {
  enabled?: boolean;
};

export function useAdminMfaStatusQuery(
  session: ClientSession | null,
  isAdminUser: boolean,
  options?: UseAdminMfaStatusQueryOptions,
) {
  const token = session?.accessToken ?? "no-session";
  const enabled = options?.enabled ?? true;

  return useQuery({
    queryKey: queryKeys.adminMfaStatus(token),
    enabled: Boolean(session) && isAdminUser && enabled,
    staleTime: 30_000,
    queryFn: async () => {
      if (!session) {
        throw new Error("Missing session");
      }

      return getAdminMfaStatus(session);
    },
  });
}
