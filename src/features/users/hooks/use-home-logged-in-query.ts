"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ClientSession } from "@/lib/client/session";
import { queryKeys } from "@/lib/client/query-keys";
import { getCampaignsQuery } from "@/features/campaigns/queries/get-campaigns.query";
import { getCharacters } from "@/features/characters/queries/characters-screen.query";
import { getMe } from "@/features/users/queries/users-profile.query";

export function useHomeLoggedInQuery(session: ClientSession | null) {
  const queryClient = useQueryClient();
  const token = session?.accessToken ?? "no-session";

  return useQuery({
    queryKey: queryKeys.homeLoggedIn(token),
    enabled: Boolean(session),
    queryFn: async () => {
      if (!session) {
        throw new Error("Missing session");
      }

      const [me, campaigns, characters] = await Promise.all([
        queryClient.ensureQueryData({
          queryKey: queryKeys.me(token),
          staleTime: 60_000,
          queryFn: async () => getMe(session),
        }),
        getCampaignsQuery(session, { scope: "public" }),
        getCharacters(session, { scope: "public" }),
      ]);

      return {
        me,
        campaigns,
        characters,
      };
    },
  });
}
