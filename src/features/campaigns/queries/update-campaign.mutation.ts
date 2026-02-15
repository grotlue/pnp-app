import type { ClientSession } from "@/lib/client/session";
import { apiRequest } from "@/lib/client/api";
import type { Campaign, CampaignFormValues } from "../types";

export async function updateCampaignMutation(
  session: ClientSession,
  campaignId: string,
  input: CampaignFormValues,
): Promise<Campaign> {
  const response = await apiRequest<Campaign>(`/api/campaigns/${campaignId}`, {
    method: "PATCH",
    session,
    body: input,
  });

  if (response.error || !response.data) {
    throw new Error(response.error?.message ?? "Failed to update campaign");
  }

  return response.data;
}
