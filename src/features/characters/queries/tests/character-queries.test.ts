import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiRequestMock, unwrapApiResponseMock } = vi.hoisted(() => ({
  apiRequestMock: vi.fn(),
  unwrapApiResponseMock: vi.fn(),
}));

vi.mock("@/lib/client/api", () => ({
  apiRequest: apiRequestMock,
  unwrapApiResponse: unwrapApiResponseMock,
}));

import { createCharacter, deleteCharacter, getCharacters } from "../characters-screen.query";
import {
  deleteCharacterFromEdit,
  getCharacterEditContext,
  updateCharacter,
} from "../character-edit.query";
import {
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
} from "../character-detail.query";

const session = { accessToken: "token-1" };

beforeEach(() => {
  vi.clearAllMocks();
  unwrapApiResponseMock.mockImplementation((response: { data: unknown }) => response.data);
});

describe("character queries", () => {
  it("getCharacters loads /api/characters", async () => {
    const response = { data: [{ id: "char1" }], error: null, status: 200 };
    apiRequestMock.mockResolvedValueOnce(response);

    await expect(getCharacters(session)).resolves.toEqual([{ id: "char1" }]);
    expect(apiRequestMock).toHaveBeenCalledWith("/api/characters", { session });
    expect(unwrapApiResponseMock).toHaveBeenCalledWith(response, "Failed to load characters");
  });

  it("createCharacter posts payload", async () => {
    const response = { data: { id: "char2" }, error: null, status: 201 };
    apiRequestMock.mockResolvedValueOnce(response);

    await expect(
      createCharacter(session, {
        type: "player",
        name: "Hero",
        age: 22,
        description: "Desc",
      }),
    ).resolves.toEqual({ id: "char2" });
    expect(apiRequestMock).toHaveBeenCalledWith("/api/characters", {
      method: "POST",
      session,
      body: {
        type: "player",
        name: "Hero",
        age: 22,
        description: "Desc",
      },
    });
    expect(unwrapApiResponseMock).toHaveBeenCalledWith(response, "Failed to create character");
  });

  it("deleteCharacter deletes by id", async () => {
    const response = { data: { deleted: true }, error: null, status: 200 };
    apiRequestMock.mockResolvedValueOnce(response);

    await expect(deleteCharacter(session, "char1")).resolves.toEqual({ deleted: true });
    expect(apiRequestMock).toHaveBeenCalledWith("/api/characters/char1", {
      method: "DELETE",
      session,
    });
    expect(unwrapApiResponseMock).toHaveBeenCalledWith(response, "Failed to delete character");
  });

  it("getCharacterEditContext loads me and character", async () => {
    apiRequestMock
      .mockResolvedValueOnce({ data: { user: { id: "u1" } }, error: null, status: 200 })
      .mockResolvedValueOnce({ data: { id: "char1" }, error: null, status: 200 });

    await expect(getCharacterEditContext(session, "char1")).resolves.toEqual({
      me: { user: { id: "u1" } },
      character: { id: "char1" },
    });
    expect(apiRequestMock).toHaveBeenNthCalledWith(1, "/api/me", { session });
    expect(apiRequestMock).toHaveBeenNthCalledWith(2, "/api/characters/char1", { session });
  });

  it("updateCharacter patches character payload", async () => {
    const response = { data: { id: "char1", name: "Updated" }, error: null, status: 200 };
    apiRequestMock.mockResolvedValueOnce(response);

    await expect(
      updateCharacter(session, "char1", {
        name: "Updated",
        age: null,
        type: "npc",
        avatarPath: null,
        description: "Desc",
      }),
    ).resolves.toEqual({ id: "char1", name: "Updated" });
    expect(apiRequestMock).toHaveBeenCalledWith("/api/characters/char1", {
      method: "PATCH",
      session,
      body: {
        name: "Updated",
        age: null,
        type: "npc",
        avatarPath: null,
        description: "Desc",
      },
    });
    expect(unwrapApiResponseMock).toHaveBeenCalledWith(response, "Failed to update character");
  });

  it("deleteCharacterFromEdit deletes character", async () => {
    const response = { data: { deleted: true }, error: null, status: 200 };
    apiRequestMock.mockResolvedValueOnce(response);

    await expect(deleteCharacterFromEdit(session, "char1")).resolves.toEqual({ deleted: true });
    expect(apiRequestMock).toHaveBeenCalledWith("/api/characters/char1", {
      method: "DELETE",
      session,
    });
    expect(unwrapApiResponseMock).toHaveBeenCalledWith(response, "Failed to delete character");
  });

  it("getCharacterDetailContext aggregates all related resources", async () => {
    apiRequestMock
      .mockResolvedValueOnce({ data: { user: { id: "u1" } }, error: null, status: 200 })
      .mockResolvedValueOnce({ data: { id: "char1" }, error: null, status: 200 })
      .mockResolvedValueOnce({ data: [{ id: "c1" }], error: null, status: 200 })
      .mockResolvedValueOnce({ data: [{ id: "char1" }, { id: "char2" }], error: null, status: 200 })
      .mockResolvedValueOnce({ data: [{ id: "u2", username: "alice" }], error: null, status: 200 })
      .mockResolvedValueOnce({ data: { categories: [], labels: [] }, error: null, status: 200 })
      .mockResolvedValueOnce({ data: [{ other_character_name: "B" }], error: null, status: 200 })
      .mockResolvedValueOnce({ data: [{ id: "rel1" }], error: null, status: 200 });

    await expect(getCharacterDetailContext(session, "char1")).resolves.toEqual({
      me: { user: { id: "u1" } },
      character: { id: "char1" },
      campaigns: [{ id: "c1" }],
      allCharacters: [{ id: "char1" }, { id: "char2" }],
      users: [{ id: "u2", username: "alice" }],
      catalog: { categories: [], labels: [] },
      summary: [{ other_character_name: "B" }],
      outgoing: [{ id: "rel1" }],
    });
    expect(apiRequestMock).toHaveBeenNthCalledWith(1, "/api/me", { session });
    expect(apiRequestMock).toHaveBeenNthCalledWith(2, "/api/characters/char1", { session });
    expect(apiRequestMock).toHaveBeenNthCalledWith(3, "/api/campaigns", { session });
    expect(apiRequestMock).toHaveBeenNthCalledWith(4, "/api/characters?limit=500", { session });
    expect(apiRequestMock).toHaveBeenNthCalledWith(5, "/api/users?limit=1000", { session });
    expect(apiRequestMock).toHaveBeenNthCalledWith(6, "/api/relationships/catalogs", { session });
    expect(apiRequestMock).toHaveBeenNthCalledWith(
      7,
      "/api/characters/char1/relations-summary",
      { session },
    );
    expect(apiRequestMock).toHaveBeenNthCalledWith(
      8,
      "/api/characters/char1/outgoing-relationships",
      { session },
    );
  });

  it("getCharacterAvatarSignedUrl requests signed URL with default expiry", async () => {
    const response = { data: { signedUrl: "https://signed" }, error: null, status: 200 };
    apiRequestMock.mockResolvedValueOnce(response);

    await expect(getCharacterAvatarSignedUrl(session, "avatars/c1.png")).resolves.toEqual({
      signedUrl: "https://signed",
    });
    expect(apiRequestMock).toHaveBeenCalledWith("/api/storage/character-images/signed-url", {
      method: "POST",
      session,
      body: { path: "avatars/c1.png", expiresIn: 600 },
    });
    expect(unwrapApiResponseMock).toHaveBeenCalledWith(response, "Failed to load character image");
  });

  it("getCharacterRelationDetail loads relation detail", async () => {
    const response = { data: { outgoing: null, incoming: null, timeline: [] }, error: null, status: 200 };
    apiRequestMock.mockResolvedValueOnce(response);

    await expect(getCharacterRelationDetail(session, "char1", "char2")).resolves.toEqual(response.data);
    expect(apiRequestMock).toHaveBeenCalledWith("/api/characters/char1/relations/char2", { session });
    expect(unwrapApiResponseMock).toHaveBeenCalledWith(response, "Failed to load relationship detail");
  });

  it("getRelationshipDetailForExternalTarget loads relationship and timeline", async () => {
    apiRequestMock
      .mockResolvedValueOnce({ data: { id: "rel1" }, error: null, status: 200 })
      .mockResolvedValueOnce({ data: [{ id: "tl1" }], error: null, status: 200 });

    await expect(getRelationshipDetailForExternalTarget(session, "rel1")).resolves.toEqual({
      outgoing: { id: "rel1" },
      timeline: [{ id: "tl1" }],
    });
    expect(apiRequestMock).toHaveBeenNthCalledWith(1, "/api/relationships/rel1", { session });
    expect(apiRequestMock).toHaveBeenNthCalledWith(2, "/api/relationships/rel1/timeline", { session });
  });

  it("assignCharacterCampaign posts campaign id", async () => {
    const response = { data: { assigned: true }, error: null, status: 200 };
    apiRequestMock.mockResolvedValueOnce(response);

    await expect(assignCharacterCampaign(session, "char1", "c1")).resolves.toEqual({
      assigned: true,
    });
    expect(apiRequestMock).toHaveBeenCalledWith("/api/characters/char1/assign-campaign", {
      method: "POST",
      session,
      body: { campaignId: "c1" },
    });
    expect(unwrapApiResponseMock).toHaveBeenCalledWith(response, "Failed to assign character");
  });

  it("unassignCharacterCampaign posts unassign request", async () => {
    const response = { data: { unassigned: true }, error: null, status: 200 };
    apiRequestMock.mockResolvedValueOnce(response);

    await expect(unassignCharacterCampaign(session, "char1")).resolves.toEqual({
      unassigned: true,
    });
    expect(apiRequestMock).toHaveBeenCalledWith("/api/characters/char1/unassign-campaign", {
      method: "POST",
      session,
    });
    expect(unwrapApiResponseMock).toHaveBeenCalledWith(response, "Failed to unassign character");
  });

  it("createRelationship posts relationship payload", async () => {
    const response = { data: { relationshipId: "rel2" }, error: null, status: 201 };
    apiRequestMock.mockResolvedValueOnce(response);

    await expect(
      createRelationship(session, {
        sourceCharacterId: "char1",
        targetCharacterId: "char2",
        categoryId: 1,
        description: "desc",
      }),
    ).resolves.toEqual({ relationshipId: "rel2" });
    expect(apiRequestMock).toHaveBeenCalledWith("/api/relationships", {
      method: "POST",
      session,
      body: {
        sourceCharacterId: "char1",
        targetCharacterId: "char2",
        categoryId: 1,
        description: "desc",
      },
    });
    expect(unwrapApiResponseMock).toHaveBeenCalledWith(response, "Failed to create relationship");
  });

  it("addRelationshipTimelineEntry posts timeline content", async () => {
    const response = { data: { timelineEntryId: "tl1" }, error: null, status: 201 };
    apiRequestMock.mockResolvedValueOnce(response);

    await expect(addRelationshipTimelineEntry(session, "rel1", "event")).resolves.toEqual({
      timelineEntryId: "tl1",
    });
    expect(apiRequestMock).toHaveBeenCalledWith("/api/relationships/rel1/timeline", {
      method: "POST",
      session,
      body: { content: "event" },
    });
    expect(unwrapApiResponseMock).toHaveBeenCalledWith(response, "Failed to create timeline entry");
  });

  it("updateRelationship patches relationship", async () => {
    const response = { data: { updated: true }, error: null, status: 200 };
    apiRequestMock.mockResolvedValueOnce(response);

    await expect(
      updateRelationship(session, "rel1", {
        categoryId: 1,
        description: "new",
        targetCharacterId: "char2",
      }),
    ).resolves.toEqual({ updated: true });
    expect(apiRequestMock).toHaveBeenCalledWith("/api/relationships/rel1", {
      method: "PATCH",
      session,
      body: {
        categoryId: 1,
        description: "new",
        targetCharacterId: "char2",
      },
    });
    expect(unwrapApiResponseMock).toHaveBeenCalledWith(response, "Failed to update relationship");
  });

  it("deleteRelationship deletes relationship", async () => {
    const response = { data: { deleted: true }, error: null, status: 200 };
    apiRequestMock.mockResolvedValueOnce(response);

    await expect(deleteRelationship(session, "rel1")).resolves.toEqual({ deleted: true });
    expect(apiRequestMock).toHaveBeenCalledWith("/api/relationships/rel1", {
      method: "DELETE",
      session,
    });
    expect(unwrapApiResponseMock).toHaveBeenCalledWith(response, "Failed to delete relationship");
  });
});
