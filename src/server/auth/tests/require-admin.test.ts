import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireAuthMock } = vi.hoisted(() => ({
  requireAuthMock: vi.fn(),
}));

vi.mock("@/server/auth/require-auth", () => ({
  requireAuth: requireAuthMock,
}));

import { requireAdmin } from "../require-admin";

beforeEach(() => {
  delete process.env.REQUIRE_ADMIN_MFA;
  vi.clearAllMocks();
});

describe("requireAdmin", () => {
  it("passes through auth response when unauthenticated", async () => {
    const response = Response.json({ error: "auth_required" }, { status: 401 });
    requireAuthMock.mockResolvedValueOnce({ response });

    const result = await requireAdmin(new Request("http://localhost/api/x"));
    expect(result).toEqual({ response });
  });

  it("returns 403 when user role is not admin", async () => {
    requireAuthMock.mockResolvedValueOnce({
      context: {
        user: { id: "u1" },
        client: {
          from: vi.fn(() => ({
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { role: "user" },
                  error: null,
                }),
              })),
            })),
          })),
        },
      },
    });

    const result = await requireAdmin(new Request("http://localhost/api/x"));
    expect("response" in result).toBe(true);
    if ("response" in result) {
      expect(result.response.status).toBe(403);
    }
  });

  it("returns context when user role is admin", async () => {
    const context = {
      user: { id: "u1" },
      client: {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { role: "admin" },
                error: null,
              }),
            })),
          })),
        })),
      },
    };
    requireAuthMock.mockResolvedValueOnce({ context });

    const result = await requireAdmin(new Request("http://localhost/api/x"));
    expect(result).toEqual({ context });
  });

  it("returns 403 when admin profile row is missing", async () => {
    requireAuthMock.mockResolvedValueOnce({
      context: {
        user: { id: "u1" },
        client: {
          from: vi.fn(() => ({
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              })),
            })),
          })),
        },
      },
    });

    const result = await requireAdmin(new Request("http://localhost/api/x"));
    expect("response" in result).toBe(true);
    if ("response" in result) {
      expect(result.response.status).toBe(403);
    }
  });

  it("returns 403 when admin MFA is required but session is aal1", async () => {
    process.env.REQUIRE_ADMIN_MFA = "true";
    const accessToken = [
      Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString(
        "base64url",
      ),
      Buffer.from(JSON.stringify({ aal: "aal1" })).toString("base64url"),
      "signature",
    ].join(".");

    requireAuthMock.mockResolvedValueOnce({
      context: {
        accessToken,
        user: { id: "u1" },
        client: {
          from: vi.fn(() => ({
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { role: "admin" },
                  error: null,
                }),
              })),
            })),
          })),
        },
      },
    });

    const result = await requireAdmin(new Request("http://localhost/api/x"));
    expect("response" in result).toBe(true);
    if ("response" in result) {
      expect(result.response.status).toBe(403);
      await expect(result.response.json()).resolves.toEqual({
        error: {
          code: "admin_mfa_required",
          message: "Admin MFA is required",
        },
      });
    }

    delete process.env.REQUIRE_ADMIN_MFA;
  });
});
