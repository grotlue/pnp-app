import type { ClientSession } from "@/lib/client/session";
import { apiRequest } from "@/lib/client/api";

type DeleteCampaignResponse = {
  deleted: boolean;
};

const deleteCampaignMutation = async (
  session: ClientSession,
  campaignId: string,
): Promise<DeleteCampaignResponse> => {
  const response = await apiRequest<DeleteCampaignResponse>(
    `/api/campaigns/${campaignId}`,
    {
      method: "DELETE",
      session,
    },
  );

  if (response.error || !response.data) {
    throw new Error(response.error?.message ?? "Failed to delete campaign");
  }

  return response.data;
};

export { deleteCampaignMutation as default, deleteCampaignMutation };
