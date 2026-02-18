import { apiRequest, unwrapApiResponse } from "@/lib/client/api";
import type { ClientSession } from "@/lib/client/session";
import type { MeResponse } from "@/features/users/types";
import type { Character } from "@/features/characters/types";
import type { Campaign, CampaignDetail, UserEntry } from "../types";

export async function getCampaignDetailContext(
  session: ClientSession,
  campaignId: string,
  me: MeResponse,
): Promise<{
  me: MeResponse;
  detail: CampaignDetail;
  characters: Character[];
  users: UserEntry[];
}> {
  const [detailResponse, charactersResponse, usersResponse] = await Promise.all(
    [
      apiRequest<CampaignDetail>(`/api/campaigns/${campaignId}`, { session }),
      apiRequest<Character[]>("/api/characters", { session }),
      apiRequest<UserEntry[]>("/api/users", { session }),
    ],
  );

  return {
    me,
    detail: unwrapApiResponse(detailResponse, "Failed to load campaign"),
    characters: unwrapApiResponse(
      charactersResponse,
      "Failed to load characters",
    ),
    users: unwrapApiResponse(usersResponse, "Failed to load users"),
  };
}

export async function decideCampaignMembership(
  session: ClientSession,
  campaignId: string,
  membershipId: string,
  state: "accepted" | "rejected",
): Promise<{ decided: boolean }> {
  const response = await apiRequest<{ decided: boolean }>(
    `/api/campaigns/${campaignId}/memberships/${membershipId}/decision`,
    {
      method: "POST",
      session,
      body: { state },
    },
  );

  return unwrapApiResponse(response, "Failed to decide membership");
}

export async function updateCampaignDetail(
  session: ClientSession,
  campaignId: string,
  input: { title: string; description: string; isPrivate?: boolean },
): Promise<Campaign> {
  const response = await apiRequest<Campaign>(`/api/campaigns/${campaignId}`, {
    method: "PATCH",
    session,
    body: input,
  });
  return unwrapApiResponse(response, "Failed to update campaign");
}

export async function deleteCampaignDetail(
  session: ClientSession,
  campaignId: string,
): Promise<{ deleted: boolean }> {
  const response = await apiRequest<{ deleted: boolean }>(
    `/api/campaigns/${campaignId}`,
    {
      method: "DELETE",
      session,
    },
  );
  return unwrapApiResponse(response, "Failed to delete campaign");
}

export async function inviteUserToCampaign(
  session: ClientSession,
  campaignId: string,
  userId: string,
): Promise<{ membershipId: string }> {
  const response = await apiRequest<{ membershipId: string }>(
    `/api/campaigns/${campaignId}/invitations`,
    {
      method: "POST",
      session,
      body: { userId },
    },
  );
  return unwrapApiResponse(response, "Failed to invite user");
}

export async function assignCharacterToCampaign(
  session: ClientSession,
  characterId: string,
  campaignId: string,
): Promise<{ assigned: boolean }> {
  const response = await apiRequest<{ assigned: boolean }>(
    `/api/characters/${characterId}/assign-campaign`,
    {
      method: "POST",
      session,
      body: { campaignId },
    },
  );
  return unwrapApiResponse(response, "Failed to assign character");
}

export async function requestJoinCampaign(
  session: ClientSession,
  campaignId: string,
): Promise<{ membershipId: string }> {
  const response = await apiRequest<{ membershipId: string }>(
    `/api/campaigns/${campaignId}/join-requests`,
    {
      method: "POST",
      session,
    },
  );
  return unwrapApiResponse(response, "Failed to request campaign join");
}
