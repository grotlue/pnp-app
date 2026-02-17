import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireAuthMock } = vi.hoisted(() => ({
  requireAuthMock: vi.fn(),
}));

vi.mock("@/server/auth/require-auth", () => ({
  requireAuth: requireAuthMock,
}));

import { GET } from "../route";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("campaigns route", () => {
  it("lists campaigns through rpc with default params", async () => {
    const rpcMock = vi.fn().mockResolvedValue({
      data: [
        {
          id: "c1",
          owner_user_id: "u1",
          title: "Dragonfall",
          description: "desc",
          is_private: false,
          created_at: "2026-02-17T12:00:00.000Z",
          updated_at: "2026-02-17T13:00:00.000Z",
          owner_username: "owner",
          owner_role: "user",
          player_count: 2,
          current_user_role: "owner",
          role_for_user: null,
        },
      ],
      error: null,
    });

    requireAuthMock.mockResolvedValueOnce({
      context: {
        client: { rpc: rpcMock },
      },
    });

    const response = await GET(new Request("http://localhost/api/campaigns"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(rpcMock).toHaveBeenCalledWith("rpc_list_campaigns_for_user", {
      p_scope: "all",
      p_role_for_user_id: null,
      p_limit: 100,
    });
    expect(body).toEqual({
      data: [
        {
          id: "c1",
          owner_user_id: "u1",
          title: "Dragonfall",
          description: "desc",
          is_private: false,
          created_at: "2026-02-17T12:00:00.000Z",
          updated_at: "2026-02-17T13:00:00.000Z",
          owner_username: "owner",
          owner_role: "user",
          player_count: 2,
          current_user_role: "owner",
          role_for_user: null,
        },
      ],
    });
  });

  it("clamps limit and forwards scope/role filters", async () => {
    const rpcMock = vi.fn().mockResolvedValue({
      data: [],
      error: null,
    });

    requireAuthMock.mockResolvedValueOnce({
      context: {
        client: { rpc: rpcMock },
      },
    });

    const response = await GET(
      new Request(
        "http://localhost/api/campaigns?scope=member&limit=900&roleForUserId=user-2",
      ),
    );

    expect(response.status).toBe(200);
    expect(rpcMock).toHaveBeenCalledWith("rpc_list_campaigns_for_user", {
      p_scope: "member",
      p_role_for_user_id: "user-2",
      p_limit: 500,
    });
  });

  it("maps rpc errors to campaign_list_failed", async () => {
    const rpcMock = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "db failed" },
    });

    requireAuthMock.mockResolvedValueOnce({
      context: {
        client: { rpc: rpcMock },
      },
    });

    const response = await GET(new Request("http://localhost/api/campaigns"));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "campaign_list_failed",
        message: "db failed",
      },
    });
  });
});
