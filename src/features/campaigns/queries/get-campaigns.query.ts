import type { ClientSession } from "@/lib/client/session";
import { apiRequest } from "@/lib/client/api";
import type { Campaign } from "../types";

export async function getCampaignsQuery(session: ClientSession): Promise<Campaign[]> {
  const response = await apiRequest<Campaign[]>("/api/campaigns", { session });
  if (response.error || !response.data) {
    throw new Error(response.error?.message ?? "Failed to load campaigns");
  }
  return response.data;
}
