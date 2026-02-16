import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createServerSupabaseClientMock,
  createServerSupabaseUserClientMock,
  createServerSupabaseUserAuthClientMock,
} = vi.hoisted(() => ({
  createServerSupabaseClientMock: vi.fn(),
  createServerSupabaseUserClientMock: vi.fn(),
  createServerSupabaseUserAuthClientMock: vi.fn(),
}));

vi.mock("@/server/supabase/server-client", () => ({
  createServerSupabaseClient: createServerSupabaseClientMock,
  createServerSupabaseUserClient: createServerSupabaseUserClientMock,
  createServerSupabaseUserAuthClient: createServerSupabaseUserAuthClientMock,
}));

import { requireAuth } from "../require-auth";

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

    expect(createServerSupabaseClientMock).toHaveBeenCalledWith();
    expect(getUserMock).toHaveBeenCalledWith("token-1");
    expect(createServerSupabaseUserClientMock).not.toHaveBeenCalled();
    expect(createServerSupabaseUserAuthClientMock).not.toHaveBeenCalled();
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

  it("uses access token cookie when bearer header is missing", async () => {
    const user = { id: "user-cookie", email: "cookie@example.com" };
    const authClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user },
          error: null,
        }),
      },
    };
    const dataClient = { from: vi.fn() };
    const authUserClient = { auth: { getUser: vi.fn() } };
    createServerSupabaseClientMock.mockReturnValue(authClient);
    createServerSupabaseUserClientMock.mockReturnValue(dataClient);
    createServerSupabaseUserAuthClientMock.mockReturnValue(authUserClient);

    const request = new Request("http://localhost/api/test", {
      headers: { cookie: "pnp_access_token=token-cookie" },
    });
    const result = await requireAuth(request);

    expect(createServerSupabaseUserClientMock).toHaveBeenCalledWith("token-cookie");
    expect(createServerSupabaseUserAuthClientMock).toHaveBeenCalledWith("token-cookie");
    expect("context" in result).toBe(true);
    if ("context" in result) {
      expect(result.context.authClient).toBe(authUserClient);
    }
  });

  it("returns auth context when token is valid", async () => {
    const user = { id: "user-1", email: "a@example.com" };
    const authClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user },
          error: null,
        }),
      },
    };
    const dataClient = { from: vi.fn() };
    const authUserClient = { auth: { getUser: vi.fn() } };
    createServerSupabaseClientMock.mockReturnValue(authClient);
    createServerSupabaseUserClientMock.mockReturnValue(dataClient);
    createServerSupabaseUserAuthClientMock.mockReturnValue(authUserClient);

    const request = new Request("http://localhost/api/test", {
      headers: { Authorization: "Bearer token-2" },
    });
    const result = await requireAuth(request);

    expect("context" in result).toBe(true);
    if ("context" in result) {
      expect(result.context.accessToken).toBe("token-2");
      expect(result.context.user).toEqual(user);
      expect(result.context.client).toBe(dataClient);
      expect(result.context.authClient).toBe(authUserClient);
    }
    expect(createServerSupabaseUserClientMock).toHaveBeenCalledWith("token-2");
    expect(createServerSupabaseUserAuthClientMock).toHaveBeenCalledWith("token-2");
  });

  it("returns 500 when auth backend throws unexpectedly", async () => {
    createServerSupabaseClientMock.mockImplementationOnce(() => {
      throw new Error("Missing environment variable: NEXT_PUBLIC_SUPABASE_URL");
    });

    const request = new Request("http://localhost/api/test", {
      headers: { Authorization: "Bearer token-3" },
    });
    const result = await requireAuth(request);

    expect("response" in result).toBe(true);
    if ("response" in result) {
      expect(result.response.status).toBe(500);
      await expect(result.response.json()).resolves.toEqual({
        error: {
          code: "auth_check_failed",
          message: "Authentication check failed",
        },
      });
    }
  });
});
