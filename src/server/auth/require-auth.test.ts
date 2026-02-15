import { beforeEach, describe, expect, it, vi } from "vitest";

const { createServerSupabaseClientMock } = vi.hoisted(() => ({
  createServerSupabaseClientMock: vi.fn(),
}));

vi.mock("@/server/supabase/server-client", () => ({
  createServerSupabaseClient: createServerSupabaseClientMock,
}));

import { requireAuth } from "./require-auth";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("requireAuth", () => {
  it("returns auth_required when bearer token is missing", async () => {
    const request = new Request("http://localhost/api/test");
    const result = await requireAuth(request);

    expect("response" in result).toBe(true);
    if ("response" in result) {
      expect(result.response.status).toBe(401);
      await expect(result.response.json()).resolves.toEqual({
        error: {
          code: "auth_required",
          message: "Authorization bearer token is required.",
        },
      });
    }
  });

  it("returns invalid_token when supabase user lookup fails", async () => {
    const getUserMock = vi.fn().mockResolvedValue({
      data: { user: null },
      error: { message: "bad token" },
    });
    createServerSupabaseClientMock.mockReturnValue({
      auth: { getUser: getUserMock },
    });

    const request = new Request("http://localhost/api/test", {
      headers: { Authorization: "Bearer token-1" },
    });
    const result = await requireAuth(request);

    expect(createServerSupabaseClientMock).toHaveBeenCalledWith("token-1");
    expect(getUserMock).toHaveBeenCalledWith("token-1");
    expect("response" in result).toBe(true);
    if ("response" in result) {
      expect(result.response.status).toBe(401);
      await expect(result.response.json()).resolves.toEqual({
        error: {
          code: "invalid_token",
          message: "Access token is invalid or expired.",
        },
      });
    }
  });

  it("returns auth context when token is valid", async () => {
    const user = { id: "user-1", email: "a@example.com" };
    const client = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user },
          error: null,
        }),
      },
    };
    createServerSupabaseClientMock.mockReturnValue(client);

    const request = new Request("http://localhost/api/test", {
      headers: { Authorization: "Bearer token-2" },
    });
    const result = await requireAuth(request);

    expect("context" in result).toBe(true);
    if ("context" in result) {
      expect(result.context.accessToken).toBe("token-2");
      expect(result.context.user).toEqual(user);
      expect(result.context.client).toBe(client);
    }
  });
});
