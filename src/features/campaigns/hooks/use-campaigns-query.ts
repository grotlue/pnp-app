"use client";

import { useQuery } from "@tanstack/react-query";
import type { ClientSession } from "@/lib/client/session";
import { getCampaignsQuery } from "../queries/get-campaigns.query";
import { getMyUserQuery } from "../queries/get-my-user.query";

export const campaignsQueryKey = ["campaigns", "screen"] as const;

export function useCampaignsQuery(session: ClientSession | null) {
  return useQuery({
    queryKey: [...campaignsQueryKey, session?.accessToken ?? "no-session"],
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
