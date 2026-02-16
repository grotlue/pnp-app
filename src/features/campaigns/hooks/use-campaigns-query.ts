"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/client/query-keys";
import type { ClientSession } from "@/lib/client/session";
import { getCampaignsQuery } from "../queries/get-campaigns.query";
import { getMyUserQuery } from "../queries/get-my-user.query";

export const campaignsQueryKey = ["campaigns", "screen"] as const;

export function useCampaignsQuery(session: ClientSession | null) {
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
        getMyUserQuery(session),
      ]);

      return {
        campaigns,
        me,
      };
    },
  });
}
