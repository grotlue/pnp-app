import type { Campaign } from "../types";

export function isCampaignOwner(
  campaign: Campaign,
  userId?: string | null,
): boolean {
  if (!userId) {
    return false;
  }
  return campaign.owner_user_id === userId;
}
