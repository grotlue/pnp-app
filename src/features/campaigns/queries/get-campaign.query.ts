import { apiRequest, unwrapApiResponse } from "@/lib/client/api";
import type { ClientSession } from "@/lib/client/session";
import type { CampaignDetail } from "@/features/campaigns/types";

export async function getCampaignDetail(
  session: ClientSession,
  campaignId: string,
): Promise<CampaignDetail> {
  const response = await apiRequest<CampaignDetail>(
    `/api/campaigns/${campaignId}`,
    {
      session,
    },
  );
  return unwrapApiResponse(response, "Failed to load campaign");
}
