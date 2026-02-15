import type { ClientSession } from "@/lib/client/session";
import { apiRequest } from "@/lib/client/api";

type DeleteCampaignResponse = {
  deleted: boolean;
};

export async function deleteCampaignMutation(
  session: ClientSession,
  campaignId: string,
): Promise<DeleteCampaignResponse> {
  const response = await apiRequest<DeleteCampaignResponse>(`/api/campaigns/${campaignId}`, {
    method: "DELETE",
    session,
  });

  if (response.error || !response.data) {
    throw new Error(response.error?.message ?? "Failed to delete campaign");
  }

  return response.data;
}
