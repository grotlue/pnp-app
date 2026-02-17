import { beforeEach, describe, expect, it, vi } from "vitest";

const { enforceRateLimitMock, getUserRoleMock, requireAuthMock } = vi.hoisted(() => ({
  requireAuthMock: vi.fn(),
  enforceRateLimitMock: vi.fn(),
  getUserRoleMock: vi.fn(),
}));

vi.mock("@/server/auth/require-auth", () => ({
  requireAuth: requireAuthMock,
}));

vi.mock("@/server/rate-limit/enforce-rate-limit", () => ({
  enforceRateLimit: enforceRateLimitMock,
}));

vi.mock("@/server/auth/get-user-role", () => ({
  getUserRole: getUserRoleMock,
}));

import { POST } from "../route";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("character image signed upload route", () => {
  it("uses the authenticated storage client for signed upload URLs", async () => {
    const maybeSingleMock = vi.fn().mockResolvedValue({
      data: { owner_user_id: "user-1", is_private: false },
      error: null,
    });
    const eqMock = vi.fn(() => ({ maybeSingle: maybeSingleMock }));
    const selectMock = vi.fn(() => ({ eq: eqMock }));
    const dataClientFromMock = vi.fn(() => ({ select: selectMock }));

    const createSignedUploadUrlWithDataClientMock = vi.fn();
    const dataClientStorageFromMock = vi.fn(() => ({
      createSignedUploadUrl: createSignedUploadUrlWithDataClientMock,
    }));

    const createSignedUploadUrlWithAuthClientMock = vi.fn().mockResolvedValue({
      data: { path: "user-1/character-1/path.png", token: "token" },
      error: null,
    });
    const authClientStorageFromMock = vi.fn(() => ({
      createSignedUploadUrl: createSignedUploadUrlWithAuthClientMock,
    }));

    requireAuthMock.mockResolvedValueOnce({
      context: {
        user: { id: "user-1" },
        client: {
          from: dataClientFromMock,
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
    enforceRateLimitMock.mockResolvedValueOnce(null);
    getUserRoleMock.mockResolvedValueOnce({ role: "user" });

    const response = await POST(
      new Request("http://localhost/api/storage/character-images/signed-upload", {
        method: "POST",
        body: JSON.stringify({
          characterId: "character-1",
          fileName: "Avatar.PNG",
          width: 256,
          height: 256,
          fileSize: 1024,
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(dataClientFromMock).toHaveBeenCalledWith("characters");
    expect(authClientStorageFromMock).toHaveBeenCalledWith("character-images");
    expect(createSignedUploadUrlWithAuthClientMock).toHaveBeenCalledTimes(1);
    expect(createSignedUploadUrlWithDataClientMock).not.toHaveBeenCalled();
    expect(dataClientStorageFromMock).not.toHaveBeenCalled();
  });
});
