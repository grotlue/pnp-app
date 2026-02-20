import type { CampaignListScope } from "@/features/campaigns/types";

const parseCampaignListScopeParam = (
  value: string | null,
): CampaignListScope => {
  if (value === "member" || value === "public") {
    return value;
  }

  return "all";
};

export { parseCampaignListScopeParam as default, parseCampaignListScopeParam };
