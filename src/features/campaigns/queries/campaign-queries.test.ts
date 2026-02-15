import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiRequestMock, unwrapApiResponseMock } = vi.hoisted(() => ({
  apiRequestMock: vi.fn(),
  unwrapApiResponseMock: vi.fn(),
}));

vi.mock("@/lib/client/api", () => ({
  apiRequest: apiRequestMock,
  unwrapApiResponse: unwrapApiResponseMock,
}));

import { createCampaignMutation } from "./create-campaign.mutation";
import { updateCampaignMutation } from "./update-campaign.mutation";
import { deleteCampaignMutation } from "./delete-campaign.mutation";
import { getCampaignsQuery } from "./get-campaigns.query";
import { getMyUserQuery } from "./get-my-user.query";
import {
  assignCharacterToCampaign,
  decideCampaignMembership,
  deleteCampaignDetail,
  getCampaignDetailContext,
  inviteUserToCampaign,
  requestJoinCampaign,
  updateCampaignDetail,
} from "./campaign-detail.query";

const session = { accessToken: "access-token" };

beforeEach(() => {
  vi.clearAllMocks();
  unwrapApiResponseMock.mockImplementation((response: { data: unknown }) => response.data);
});

describe("campaign queries", () => {
  it("getCampaignsQuery returns campaigns on success", async () => {
    const data = [{ id: "c1", owner_user_id: "u1", title: "A", description: "" }];
    apiRequestMock.mockResolvedValueOnce({ data, error: null, status: 200 });

    await expect(getCampaignsQuery(session)).resolves.toEqual(data);
    expect(apiRequestMock).toHaveBeenCalledWith("/api/campaigns", { session });
  });

  it("getCampaignsQuery throws on error response", async () => {
    apiRequestMock.mockResolvedValueOnce({
      data: null,
      error: { code: "x", message: "failed" },
      status: 500,
    });

    await expect(getCampaignsQuery(session)).rejects.toThrowError("failed");
  });

  it("createCampaignMutation posts and returns campaign id", async () => {
    const data = { campaignId: "c-new" };
    apiRequestMock.mockResolvedValueOnce({ data, error: null, status: 201 });

    await expect(
      createCampaignMutation(session, {
        title: "New",
        description: "Desc",
      }),
    ).resolves.toEqual(data);
    expect(apiRequestMock).toHaveBeenCalledWith("/api/campaigns", {
      method: "POST",
      session,
      body: { title: "New", description: "Desc" },
    });
  });

  it("updateCampaignMutation patches campaign", async () => {
    const data = { id: "c1", owner_user_id: "u1", title: "Updated", description: "D" };
    apiRequestMock.mockResolvedValueOnce({ data, error: null, status: 200 });

    await expect(
      updateCampaignMutation(session, "c1", {
        title: "Updated",
        description: "D",
      }),
    ).resolves.toEqual(data);
    expect(apiRequestMock).toHaveBeenCalledWith("/api/campaigns/c1", {
      method: "PATCH",
      session,
      body: { title: "Updated", description: "D" },
    });
  });

  it("deleteCampaignMutation deletes campaign", async () => {
    const data = { deleted: true };
    apiRequestMock.mockResolvedValueOnce({ data, error: null, status: 200 });

    await expect(deleteCampaignMutation(session, "c1")).resolves.toEqual(data);
    expect(apiRequestMock).toHaveBeenCalledWith("/api/campaigns/c1", {
      method: "DELETE",
      session,
    });
  });

  it("getMyUserQuery loads /api/me", async () => {
    const data = { user: { id: "u1" } };
    apiRequestMock.mockResolvedValueOnce({ data, error: null, status: 200 });

    await expect(getMyUserQuery(session)).resolves.toEqual(data);
    expect(apiRequestMock).toHaveBeenCalledWith("/api/me", { session });
  });

  it("getCampaignDetailContext aggregates dependent resources", async () => {
    apiRequestMock
      .mockResolvedValueOnce({ data: { user: { id: "u1" } }, error: null, status: 200 })
      .mockResolvedValueOnce({
        data: { campaign: { id: "c1" }, memberships: [] },
        error: null,
        status: 200,
      })
      .mockResolvedValueOnce({ data: [{ id: "char1" }], error: null, status: 200 })
      .mockResolvedValueOnce({ data: [{ id: "user2", username: "x" }], error: null, status: 200 });

    const result = await getCampaignDetailContext(session, "c1");

    expect(apiRequestMock).toHaveBeenNthCalledWith(1, "/api/me", { session });
    expect(apiRequestMock).toHaveBeenNthCalledWith(2, "/api/campaigns/c1", { session });
    expect(apiRequestMock).toHaveBeenNthCalledWith(3, "/api/characters", { session });
    expect(apiRequestMock).toHaveBeenNthCalledWith(4, "/api/users", { session });

    expect(result).toEqual({
      me: { user: { id: "u1" } },
      detail: { campaign: { id: "c1" }, memberships: [] },
      characters: [{ id: "char1" }],
      users: [{ id: "user2", username: "x" }],
    });
  });

  it("decideCampaignMembership posts decision state", async () => {
    const response = { data: { decided: true }, error: null, status: 200 };
    apiRequestMock.mockResolvedValueOnce(response);

    await expect(decideCampaignMembership(session, "c1", "m1", "accepted")).resolves.toEqual({
      decided: true,
    });
    expect(apiRequestMock).toHaveBeenCalledWith("/api/campaigns/c1/memberships/m1/decision", {
      method: "POST",
      session,
      body: { state: "accepted" },
    });
    expect(unwrapApiResponseMock).toHaveBeenCalledWith(response, "Failed to decide membership");
  });

  it("updateCampaignDetail patches campaign detail", async () => {
    const response = {
      data: { id: "c1", owner_user_id: "u1", title: "T", description: "D" },
      error: null,
      status: 200,
    };
    apiRequestMock.mockResolvedValueOnce(response);

    await expect(updateCampaignDetail(session, "c1", { title: "T", description: "D" })).resolves.toEqual(
      response.data,
    );
    expect(apiRequestMock).toHaveBeenCalledWith("/api/campaigns/c1", {
      method: "PATCH",
      session,
      body: { title: "T", description: "D" },
    });
    expect(unwrapApiResponseMock).toHaveBeenCalledWith(response, "Failed to update campaign");
  });

  it("deleteCampaignDetail deletes campaign", async () => {
    const response = { data: { deleted: true }, error: null, status: 200 };
    apiRequestMock.mockResolvedValueOnce(response);

    await expect(deleteCampaignDetail(session, "c1")).resolves.toEqual({ deleted: true });
    expect(apiRequestMock).toHaveBeenCalledWith("/api/campaigns/c1", {
      method: "DELETE",
      session,
    });
    expect(unwrapApiResponseMock).toHaveBeenCalledWith(response, "Failed to delete campaign");
  });

  it("inviteUserToCampaign posts invite payload", async () => {
    const response = { data: { membershipId: "m1" }, error: null, status: 201 };
    apiRequestMock.mockResolvedValueOnce(response);

    await expect(inviteUserToCampaign(session, "c1", "u2")).resolves.toEqual({
      membershipId: "m1",
    });
    expect(apiRequestMock).toHaveBeenCalledWith("/api/campaigns/c1/invitations", {
      method: "POST",
      session,
      body: { userId: "u2" },
    });
    expect(unwrapApiResponseMock).toHaveBeenCalledWith(response, "Failed to invite user");
  });

  it("assignCharacterToCampaign posts assignment payload", async () => {
    const response = { data: { assigned: true }, error: null, status: 200 };
    apiRequestMock.mockResolvedValueOnce(response);

    await expect(assignCharacterToCampaign(session, "char1", "c1")).resolves.toEqual({
      assigned: true,
    });
    expect(apiRequestMock).toHaveBeenCalledWith("/api/characters/char1/assign-campaign", {
      method: "POST",
      session,
      body: { campaignId: "c1" },
    });
    expect(unwrapApiResponseMock).toHaveBeenCalledWith(response, "Failed to assign character");
  });

  it("requestJoinCampaign posts join request", async () => {
    const response = { data: { membershipId: "m2" }, error: null, status: 201 };
    apiRequestMock.mockResolvedValueOnce(response);

    await expect(requestJoinCampaign(session, "c1")).resolves.toEqual({ membershipId: "m2" });
    expect(apiRequestMock).toHaveBeenCalledWith("/api/campaigns/c1/join-requests", {
      method: "POST",
      session,
    });
    expect(unwrapApiResponseMock).toHaveBeenCalledWith(response, "Failed to request campaign join");
  });
});
