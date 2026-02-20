"use client";

import { useQuery } from "@tanstack/react-query";
import type { ClientSession } from "@/lib/client/session";
import { queryKeys } from "@/lib/client/query-keys";
import type { Campaign } from "@/features/campaigns/types";
import { getCampaignsQuery } from "@/features/campaigns/queries/get-campaigns.query";
import { getCharacters } from "@/features/characters/queries/characters-screen.query";
import { getPublicUserProfile } from "@/features/users/queries/users-public-profile.query";

type ProfileCampaignEntry = {
  campaign: Campaign;
  role: "owner" | "player";
};

const useUserProfileScreenQuery = (
  session: ClientSession | null,
  userId: string,
) => {
  const token = session?.accessToken ?? "no-session";

  return useQuery({
    queryKey: queryKeys.usersPublicProfile(userId, token),
    enabled: Boolean(session),
    queryFn: async () => {
      if (!session) {
        throw new Error("Missing session");
      }

      const [profile, campaigns, characters] = await Promise.all([
        getPublicUserProfile(session, userId),
        getCampaignsQuery(session, { roleForUserId: userId }),
        getCharacters(session),
      ]);
      const profileCampaigns: ProfileCampaignEntry[] = campaigns
        .filter(
          (campaign) =>
            campaign.role_for_user === "owner" ||
            campaign.role_for_user === "player",
        )
        .map((campaign) => ({
          campaign,
          role: campaign.role_for_user === "owner" ? "owner" : "player",
        }));

      return {
        profile,
        campaigns: profileCampaigns,
        characters: characters.filter(
          (character) => character.owner_user_id === userId,
        ),
      };
    },
  });
};

export { useUserProfileScreenQuery as default, useUserProfileScreenQuery };
