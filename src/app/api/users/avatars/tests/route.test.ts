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

describe("users avatars route", () => {
  it("returns early when authentication fails", async () => {
    const deniedResponse = Response.json(
      { error: { code: "auth_required" } },
      { status: 401 },
    );
    requireAuthMock.mockResolvedValueOnce({ response: deniedResponse });

    const response = await GET(
      new Request("http://localhost/api/users/avatars"),
    );

    expect(response.status).toBe(401);
  });

  it("uses authenticated storage client and filters admin profiles", async () => {
    const createSignedUrlsWithAuthClientMock = vi.fn().mockResolvedValue({
      data: [
        {
          path: "user-1/avatar.png",
          signedUrl: "https://example.test/user-1-avatar",
        },
      ],
      error: null,
    });
    const authClientStorageFromMock = vi.fn(() => ({
      createSignedUrls: createSignedUrlsWithAuthClientMock,
    }));

    const createSignedUrlsWithDataClientMock = vi.fn();
    const dataClientStorageFromMock = vi.fn(() => ({
      createSignedUrls: createSignedUrlsWithDataClientMock,
    }));

    const orderMock = vi.fn().mockResolvedValue({
      data: [
        {
          id: "user-1",
          username: "Alice",
          avatar_path: "user-1/avatar.png",
          role: "user",
        },
        {
          id: "admin-1",
          username: "Admin",
          avatar_path: "admin-1/avatar.png",
          role: "admin",
        },
        {
          id: "user-2",
          username: "Bob",
          avatar_path: null,
          role: "user",
        },
      ],
      error: null,
    });
    const limitMock = vi.fn(() => ({ order: orderMock }));
    const selectMock = vi.fn(() => ({ limit: limitMock }));
    const fromMock = vi.fn(() => ({ select: selectMock }));

    requireAuthMock.mockResolvedValueOnce({
      context: {
        client: {
          from: fromMock,
          storage: {
            from: dataClientStorageFromMock,
          },
        },
        authClient: {
          storage: {
            from: authClientStorageFromMock,
          },
        },
      },
    });

    const response = await GET(
      new Request("http://localhost/api/users/avatars?limit=50"),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(fromMock).toHaveBeenCalledWith("profiles");
    expect(selectMock).toHaveBeenCalledWith("id, username, avatar_path, role");
    expect(limitMock).toHaveBeenCalledWith(50);
    expect(orderMock).toHaveBeenCalledWith("username", { ascending: true });

    expect(authClientStorageFromMock).toHaveBeenCalledWith("profile-images");
    expect(createSignedUrlsWithAuthClientMock).toHaveBeenCalledWith(
      ["user-1/avatar.png"],
      600,
    );
    expect(createSignedUrlsWithDataClientMock).not.toHaveBeenCalled();
    expect(dataClientStorageFromMock).not.toHaveBeenCalled();

    expect(body).toEqual({
      data: [
        {
          id: "user-1",
          username: "Alice",
          avatarPath: "user-1/avatar.png",
          avatarUrl: "https://example.test/user-1-avatar",
        },
        {
          id: "user-2",
          username: "Bob",
          avatarPath: null,
          avatarUrl: null,
        },
      ],
    });
  });
});
