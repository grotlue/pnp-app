import type { ClientSession } from "@/lib/client/session";
import { apiRequest } from "@/lib/client/api";
import type { Campaign, CampaignFormValues } from "../types";

const updateCampaignMutation = async (
  session: ClientSession,
  campaignId: string,
  input: CampaignFormValues,
): Promise<Campaign> => {
  const response = await apiRequest<Campaign>(`/api/campaigns/${campaignId}`, {
    method: "PATCH",
    session,
    body: input,
  });

  if (response.error || !response.data) {
    throw new Error(response.error?.message ?? "Failed to update campaign");
  }

  return response.data;
};

export { updateCampaignMutation as default, updateCampaignMutation };
