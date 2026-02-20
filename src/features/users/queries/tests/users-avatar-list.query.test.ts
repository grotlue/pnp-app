import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiRequestMock, unwrapApiResponseMock } = vi.hoisted(() => ({
  apiRequestMock: vi.fn(),
  unwrapApiResponseMock: vi.fn(),
}));

vi.mock("@/lib/client/api", () => ({
  apiRequest: apiRequestMock,
  unwrapApiResponse: unwrapApiResponseMock,
}));

import { getUsersAvatarList } from "../users-avatar-list.query";

const session = {
  accessToken: "access-token",
  refreshToken: "refresh-token",
};

beforeEach(() => {
  vi.clearAllMocks();
  unwrapApiResponseMock.mockImplementation(
    (response: { data: unknown }) => response.data,
  );
});

describe("users avatar list query", () => {
  it("loads user avatars from the dedicated endpoint", async () => {
    const response = {
      data: [
        {
          id: "user-1",
          username: "Alice",
          avatarPath: "user-1/avatar.png",
          avatarUrl: "https://example.test/user-1-avatar",
        },
      ],
      error: null,
      status: 200,
    };
    apiRequestMock.mockResolvedValueOnce(response);

    await expect(getUsersAvatarList(session)).resolves.toEqual(response.data);
    expect(apiRequestMock).toHaveBeenCalledWith(
      "/api/users/avatars?limit=1000",
      {
        session,
      },
    );
    expect(unwrapApiResponseMock).toHaveBeenCalledWith(
      response,
      "Failed to load user avatars",
    );
  });
});
