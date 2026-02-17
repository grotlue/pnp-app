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

describe("notifications route", () => {
  it("lists notifications through rpc with default limit", async () => {
    const rpcMock = vi.fn().mockResolvedValue({
      data: [
        {
          id: "n1",
          recipient_user_id: "u1",
          event_type: "relationship_created",
          source_character_id: "c1",
          target_character_id: "c2",
          payload: { relationship_id: "r1" },
          is_read: false,
          created_at: "2026-02-17T12:00:00.000Z",
          read_at: null,
        },
      ],
      error: null,
    });

    requireAuthMock.mockResolvedValueOnce({
      context: {
        client: { rpc: rpcMock },
      },
    });

    const response = await GET(
      new Request("http://localhost/api/notifications"),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(rpcMock).toHaveBeenCalledWith("rpc_list_notifications_for_user", {
      p_limit: 100,
      p_only_unread: false,
    });
    expect(body).toEqual({
      data: [
        {
          id: "n1",
          recipient_user_id: "u1",
          event_type: "relationship_created",
          source_character_id: "c1",
          target_character_id: "c2",
          payload: { relationship_id: "r1" },
          is_read: false,
          created_at: "2026-02-17T12:00:00.000Z",
          read_at: null,
        },
      ],
    });
  });

  it("clamps list limit to max bound", async () => {
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
      new Request("http://localhost/api/notifications?limit=900"),
    );

    expect(response.status).toBe(200);
    expect(rpcMock).toHaveBeenCalledWith("rpc_list_notifications_for_user", {
      p_limit: 500,
      p_only_unread: false,
    });
  });

  it("maps rpc errors to notifications_list_failed", async () => {
    const rpcMock = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "notifications failed" },
    });

    requireAuthMock.mockResolvedValueOnce({
      context: {
        client: { rpc: rpcMock },
      },
    });

    const response = await GET(
      new Request("http://localhost/api/notifications"),
    );
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "notifications_list_failed",
        message: "notifications failed",
      },
    });
  });
});
