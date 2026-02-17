import { apiRequest, unwrapApiResponse } from "@/lib/client/api";
import type { ClientSession } from "@/lib/client/session";
import type {
  AdminCampaign,
  AdminCreateCampaignInput,
  AdminUpdateCampaignInput,
} from "../types";

export async function listAdminCampaigns(
  session: ClientSession,
): Promise<AdminCampaign[]> {
  const response = await apiRequest<AdminCampaign[]>("/api/admin/campaigns", {
    session,
  });
  return unwrapApiResponse(response, "Failed to load campaigns");
}

export async function createAdminCampaign(
  session: ClientSession,
  input: AdminCreateCampaignInput,
): Promise<AdminCampaign> {
  const response = await apiRequest<AdminCampaign>("/api/admin/campaigns", {
    method: "POST",
    session,
    body: input,
  });
  return unwrapApiResponse(response, "Failed to create campaign");
}

export async function updateAdminCampaign(
  session: ClientSession,
  campaignId: string,
  input: AdminUpdateCampaignInput,
): Promise<AdminCampaign> {
  const response = await apiRequest<AdminCampaign>(
    `/api/admin/campaigns/${campaignId}`,
    {
      method: "PATCH",
      session,
      body: input,
    },
  );
  return unwrapApiResponse(response, "Failed to update campaign");
}

export async function deleteAdminCampaign(
  session: ClientSession,
  campaignId: string,
): Promise<{ deleted: true }> {
  const response = await apiRequest<{ deleted: true }>(
    `/api/admin/campaigns/${campaignId}`,
    {
      method: "DELETE",
      session,
    },
  );
  return unwrapApiResponse(response, "Failed to delete campaign");
}
