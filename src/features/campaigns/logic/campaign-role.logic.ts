import type { Campaign } from "../types";

const isCampaignOwner = (
  campaign: Campaign,
  userId?: string | null,
): boolean => {
  if (!userId) {
    return false;
  }
  return campaign.owner_user_id === userId;
};

export { isCampaignOwner as default, isCampaignOwner };
