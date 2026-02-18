"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/client/query-keys";
import type { ClientSession } from "@/lib/client/session";
import { getCampaignsQuery } from "../queries/get-campaigns.query";
import { getMe } from "@/features/users/queries/users-profile.query";

export function useCampaignsQuery(session: ClientSession | null) {
  const queryClient = useQueryClient();
  const token = session?.accessToken ?? "no-session";

  return useQuery({
    queryKey: queryKeys.campaignsScreen(token),
    enabled: Boolean(session),
    queryFn: async () => {
      if (!session) {
        throw new Error("Missing session");
      }

      const [campaigns, me] = await Promise.all([
        getCampaignsQuery(session, { scope: "member" }),
        queryClient.ensureQueryData({
          queryKey: queryKeys.me(token),
          staleTime: 60_000,
          queryFn: async () => getMe(session),
        }),
      ]);

      return {
        campaigns,
        me,
      };
    },
  });
}
