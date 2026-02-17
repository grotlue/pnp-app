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

describe("notifications unread-count route", () => {
  it("returns unread count through rpc", async () => {
    const rpcMock = vi.fn().mockResolvedValue({
      data: 3,
      error: null,
    });

    requireAuthMock.mockResolvedValueOnce({
      context: {
        client: { rpc: rpcMock },
      },
    });

    const response = await GET(
      new Request("http://localhost/api/notifications/unread-count"),
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: {
        unreadCount: 3,
      },
    });
  });

  it("maps rpc errors to notifications_unread_count_failed", async () => {
    const rpcMock = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "count failed" },
    });

    requireAuthMock.mockResolvedValueOnce({
      context: {
        client: { rpc: rpcMock },
      },
    });

    const response = await GET(
      new Request("http://localhost/api/notifications/unread-count"),
    );
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "notifications_unread_count_failed",
        message: "count failed",
      },
    });
  });
});
