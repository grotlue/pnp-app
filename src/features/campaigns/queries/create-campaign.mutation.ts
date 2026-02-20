import type { ClientSession } from "@/lib/client/session";
import { apiRequest } from "@/lib/client/api";
import type { CampaignFormValues } from "../types";

type CreateCampaignResponse = {
  campaignId: string;
};

const createCampaignMutation = async (
  session: ClientSession,
  input: CampaignFormValues,
): Promise<CreateCampaignResponse> => {
  const response = await apiRequest<CreateCampaignResponse>("/api/campaigns", {
    method: "POST",
    session,
    body: input,
  });

  if (response.error || !response.data) {
    throw new Error(response.error?.message ?? "Failed to create campaign");
  }

  return response.data;
};

export { createCampaignMutation as default, createCampaignMutation };
