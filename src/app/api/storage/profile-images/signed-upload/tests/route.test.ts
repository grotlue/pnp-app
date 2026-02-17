import { beforeEach, describe, expect, it, vi } from "vitest";

const { enforceRateLimitMock, requireAuthMock } = vi.hoisted(() => ({
  requireAuthMock: vi.fn(),
  enforceRateLimitMock: vi.fn(),
}));

vi.mock("@/server/auth/require-auth", () => ({
  requireAuth: requireAuthMock,
}));

vi.mock("@/server/rate-limit/enforce-rate-limit", () => ({
  enforceRateLimit: enforceRateLimitMock,
}));

import { POST } from "../route";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("profile image signed upload route", () => {
  it("uses the authenticated storage client for signed upload URLs", async () => {
    const createSignedUploadUrlWithAuthClientMock = vi.fn().mockResolvedValue({
      data: { path: "user-1/path.png", token: "token" },
      error: null,
    });
    const authClientStorageFromMock = vi.fn(() => ({
      createSignedUploadUrl: createSignedUploadUrlWithAuthClientMock,
    }));

    const createSignedUploadUrlWithDataClientMock = vi.fn();
    const dataClientStorageFromMock = vi.fn(() => ({
      createSignedUploadUrl: createSignedUploadUrlWithDataClientMock,
    }));

    requireAuthMock.mockResolvedValueOnce({
      context: {
        user: { id: "user-1" },
        client: {
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

    const response = await POST(
      new Request("http://localhost/api/storage/profile-images/signed-upload", {
        method: "POST",
        body: JSON.stringify({
          fileName: "Avatar.PNG",
          width: 256,
          height: 256,
          fileSize: 1024,
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(authClientStorageFromMock).toHaveBeenCalledWith("profile-images");
    expect(createSignedUploadUrlWithAuthClientMock).toHaveBeenCalledTimes(1);
    expect(createSignedUploadUrlWithDataClientMock).not.toHaveBeenCalled();
    expect(dataClientStorageFromMock).not.toHaveBeenCalled();
  });
});
