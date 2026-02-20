import { apiRequest, unwrapApiResponse } from "@/lib/client/api";
import type { ClientSession } from "@/lib/client/session";
import type { MeResponse, UserListEntry } from "@/features/users/types";
import type { Campaign } from "@/features/campaigns/types";
import type {
  OutgoingRelationship,
  RelationshipCatalog,
  RelationshipDetail,
  RelationshipSummary,
  RelationshipTimelineEntry,
} from "@/features/relationships/types";
import type { Character } from "../types";

const getCharacterDetailContext = async (
  session: ClientSession,
  characterId: string,
  me: MeResponse,
): Promise<{
  me: MeResponse;
  character: Character;
  campaigns: Campaign[];
  allCharacters: Character[];
  users: UserListEntry[];
  catalog: RelationshipCatalog;
  summary: RelationshipSummary[];
  outgoing: OutgoingRelationship[];
}> => {
  const [
    characterResponse,
    campaignsResponse,
    allCharactersResponse,
    usersResponse,
    catalogResponse,
    summaryResponse,
    outgoingResponse,
  ] = await Promise.all([
    apiRequest<Character>(`/api/characters/${characterId}`, { session }),
    apiRequest<Campaign[]>("/api/campaigns", { session }),
    apiRequest<Character[]>("/api/characters?limit=500", { session }),
    apiRequest<UserListEntry[]>("/api/users?limit=1000", { session }),
    apiRequest<RelationshipCatalog>("/api/relationships/catalogs", { session }),
    apiRequest<RelationshipSummary[]>(
      `/api/characters/${characterId}/relations-summary`,
      { session },
    ),
    apiRequest<OutgoingRelationship[]>(
      `/api/characters/${characterId}/outgoing-relationships`,
      {
        session,
      },
    ),
  ]);

  return {
    me,
    character: unwrapApiResponse(characterResponse, "Failed to load character"),
    campaigns: unwrapApiResponse(campaignsResponse, "Failed to load campaigns"),
    allCharacters: unwrapApiResponse(
      allCharactersResponse,
      "Failed to load characters",
    ),
    users: unwrapApiResponse(usersResponse, "Failed to load users"),
    catalog: unwrapApiResponse(
      catalogResponse,
      "Failed to load relationship catalogs",
    ),
    summary: unwrapApiResponse(
      summaryResponse,
      "Failed to load relationship summary",
    ),
    outgoing: unwrapApiResponse(
      outgoingResponse,
      "Failed to load outgoing relationships",
    ),
  };
};

const getCharacterAvatarSignedUrl = async (
  session: ClientSession,
  path: string,
): Promise<{ signedUrl: string }> => {
  const response = await apiRequest<{ signedUrl: string }>(
    "/api/storage/character-images/signed-url",
    {
      method: "POST",
      session,
      body: {
        path,
        expiresIn: 600,
      },
    },
  );
  return unwrapApiResponse(response, "Failed to load character image");
};

const getCharacterRelationDetail = async (
  session: ClientSession,
  characterId: string,
  otherCharacterId: string,
): Promise<RelationshipDetail> => {
  const response = await apiRequest<RelationshipDetail>(
    `/api/characters/${characterId}/relations/${otherCharacterId}`,
    { session },
  );
  return unwrapApiResponse(response, "Failed to load relationship detail");
};

const getRelationshipDetailForExternalTarget = async (
  session: ClientSession,
  relationshipId: string,
): Promise<{
  outgoing: OutgoingRelationship;
  timeline: RelationshipTimelineEntry[];
}> => {
  const [relationshipResponse, timelineResponse] = await Promise.all([
    apiRequest<OutgoingRelationship>(`/api/relationships/${relationshipId}`, {
      session,
    }),
    apiRequest<RelationshipTimelineEntry[]>(
      `/api/relationships/${relationshipId}/timeline`,
      { session },
    ),
  ]);

  return {
    outgoing: unwrapApiResponse(
      relationshipResponse,
      "Failed to load relationship",
    ),
    timeline: unwrapApiResponse(
      timelineResponse,
      "Failed to load relationship timeline",
    ),
  };
};

const assignCharacterCampaign = async (
  session: ClientSession,
  characterId: string,
  campaignId: string,
): Promise<{ assigned: boolean }> => {
  const response = await apiRequest<{ assigned: boolean }>(
    `/api/characters/${characterId}/assign-campaign`,
    {
      method: "POST",
      session,
      body: { campaignId },
    },
  );
  return unwrapApiResponse(response, "Failed to assign character");
};

const unassignCharacterCampaign = async (
  session: ClientSession,
  characterId: string,
): Promise<{ unassigned: boolean }> => {
  const response = await apiRequest<{ unassigned: boolean }>(
    `/api/characters/${characterId}/unassign-campaign`,
    {
      method: "POST",
      session,
    },
  );
  return unwrapApiResponse(response, "Failed to unassign character");
};

const createRelationship = async (
  session: ClientSession,
  input: {
    sourceCharacterId: string;
    targetCharacterId?: string | null;
    targetSnapshotName?: string | null;
    categoryId: number;
    labelPresetId?: number | null;
    labelCustom?: string | null;
    description: string;
  },
): Promise<{ relationshipId: string }> => {
  const response = await apiRequest<{ relationshipId: string }>(
    "/api/relationships",
    {
      method: "POST",
      session,
      body: input,
    },
  );
  return unwrapApiResponse(response, "Failed to create relationship");
};

const addRelationshipTimelineEntry = async (
  session: ClientSession,
  relationshipId: string,
  content: string,
): Promise<{ timelineEntryId: string }> => {
  const response = await apiRequest<{ timelineEntryId: string }>(
    `/api/relationships/${relationshipId}/timeline`,
    {
      method: "POST",
      session,
      body: { content },
    },
  );
  return unwrapApiResponse(response, "Failed to create timeline entry");
};

const updateRelationship = async (
  session: ClientSession,
  relationshipId: string,
  input: {
    targetCharacterId?: string | null;
    targetSnapshotName?: string | null;
    categoryId: number;
    labelPresetId?: number | null;
    labelCustom?: string | null;
    description: string;
  },
): Promise<{ updated: boolean }> => {
  const response = await apiRequest<{ updated: boolean }>(
    `/api/relationships/${relationshipId}`,
    {
      method: "PATCH",
      session,
      body: input,
    },
  );
  return unwrapApiResponse(response, "Failed to update relationship");
};

const deleteRelationship = async (
  session: ClientSession,
  relationshipId: string,
): Promise<{ deleted: boolean }> => {
  const response = await apiRequest<{ deleted: boolean }>(
    `/api/relationships/${relationshipId}`,
    {
      method: "DELETE",
      session,
    },
  );
  return unwrapApiResponse(response, "Failed to delete relationship");
};

export {
  addRelationshipTimelineEntry,
  assignCharacterCampaign,
  createRelationship,
  deleteRelationship,
  getCharacterAvatarSignedUrl,
  getCharacterDetailContext,
  getCharacterRelationDetail,
  getRelationshipDetailForExternalTarget,
  unassignCharacterCampaign,
  updateRelationship,
};
