import type { ClientSession } from "@/lib/client/session";
import { apiRequest } from "@/lib/client/api";
import type { Campaign } from "../types";

type GetCampaignsQueryOptions = {
  roleForUserId?: string;
  scope?: "member" | "public";
};

export async function getCampaignsQuery(
  session: ClientSession,
  options?: GetCampaignsQueryOptions,
): Promise<Campaign[]> {
  const searchParams = new URLSearchParams();
  if (options?.roleForUserId) {
    searchParams.set("roleForUserId", options.roleForUserId);
  }
  if (options?.scope) {
    searchParams.set("scope", options.scope);
  }
  const path =
    searchParams.size > 0
      ? `/api/campaigns?${searchParams.toString()}`
      : "/api/campaigns";

  const response = await apiRequest<Campaign[]>(path, { session });
  if (response.error || !response.data) {
    throw new Error(response.error?.message ?? "Failed to load campaigns");
  }
  return response.data;
}
