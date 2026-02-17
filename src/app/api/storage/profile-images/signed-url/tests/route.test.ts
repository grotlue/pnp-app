import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireAuthMock } = vi.hoisted(() => ({
  requireAuthMock: vi.fn(),
}));

vi.mock("@/server/auth/require-auth", () => ({
  requireAuth: requireAuthMock,
}));

import { POST } from "../route";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("profile image signed url route", () => {
  it("uses the authenticated storage client for signed URLs", async () => {
    const createSignedUrlWithAuthClientMock = vi.fn().mockResolvedValue({
      data: { signedUrl: "https://example.test/signed" },
      error: null,
    });
    const authClientStorageFromMock = vi.fn(() => ({
      createSignedUrl: createSignedUrlWithAuthClientMock,
    }));

    const createSignedUrlWithDataClientMock = vi.fn();
    const dataClientStorageFromMock = vi.fn(() => ({
      createSignedUrl: createSignedUrlWithDataClientMock,
    }));

    requireAuthMock.mockResolvedValueOnce({
      context: {
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

    const response = await POST(
      new Request("http://localhost/api/storage/profile-images/signed-url", {
        method: "POST",
        body: JSON.stringify({
          path: "user-1/avatar.png",
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(authClientStorageFromMock).toHaveBeenCalledWith("profile-images");
    expect(createSignedUrlWithAuthClientMock).toHaveBeenCalledWith("user-1/avatar.png", 600);
    expect(createSignedUrlWithDataClientMock).not.toHaveBeenCalled();
    expect(dataClientStorageFromMock).not.toHaveBeenCalled();
  });
});
