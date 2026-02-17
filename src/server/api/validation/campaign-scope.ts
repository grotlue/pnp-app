import type { CampaignListScope } from "@/features/campaigns/types";

export function parseCampaignListScopeParam(
  value: string | null,
): CampaignListScope {
  if (value === "member" || value === "public") {
    return value;
  }

  return "all";
}
