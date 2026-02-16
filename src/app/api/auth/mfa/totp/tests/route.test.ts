import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireAuthMock, getUserRoleMock, enforceRateLimitMock } = vi.hoisted(() => ({
  requireAuthMock: vi.fn(),
  getUserRoleMock: vi.fn(),
  enforceRateLimitMock: vi.fn(),
}));

vi.mock("@/server/auth/require-auth", () => ({
  requireAuth: requireAuthMock,
}));

vi.mock("@/server/auth/get-user-role", () => ({
  getUserRole: getUserRoleMock,
}));

vi.mock("@/server/rate-limit/enforce-rate-limit", () => ({
  enforceRateLimit: enforceRateLimitMock,
}));

import { GET, PATCH, POST } from "../route";

beforeEach(() => {
  vi.clearAllMocks();
  enforceRateLimitMock.mockResolvedValue(null);
});

describe("auth mfa totp route", () => {
  it("returns 403 for non-admin users", async () => {
    requireAuthMock.mockResolvedValueOnce({
      context: {
        accessToken: "token",
        user: { id: "u1" },
        client: { from: vi.fn() },
        authClient: { auth: { mfa: {} } },
      },
    });
    getUserRoleMock.mockResolvedValueOnce({ role: "user" });

    const response = await GET(new Request("http://localhost/api/auth/mfa/totp"));

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "admin_required",
        message: "Admin access required",
      },
    });
  });

  it("enrolls totp factor for admin users", async () => {
    const enrollMock = vi.fn().mockResolvedValue({
      data: {
        id: "factor-1",
        friendly_name: "admin-factor",
        totp: {
          qr_code: "<svg />",
          secret: "SECRET",
          uri: "otpauth://totp/pnp-app",
        },
      },
      error: null,
    });
    requireAuthMock.mockResolvedValueOnce({
      context: {
        accessToken: "token",
        user: { id: "u1" },
        client: { from: vi.fn() },
        authClient: { auth: { mfa: { enroll: enrollMock } } },
      },
    });
    getUserRoleMock.mockResolvedValueOnce({ role: "admin" });

    const response = await POST(
      new Request("http://localhost/api/auth/mfa/totp", {
        method: "POST",
        body: JSON.stringify({ friendlyName: "admin-factor" }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(enrollMock).toHaveBeenCalledWith({
      factorType: "totp",
      issuer: "pnp-app",
      friendlyName: "admin-factor",
    });
    expect(body).toEqual({
      data: {
        factorId: "factor-1",
        friendlyName: "admin-factor",
        qrCode: "<svg />",
        secret: "SECRET",
        uri: "otpauth://totp/pnp-app",
      },
    });
  });

  it("returns 400 when enrollment response is incomplete", async () => {
    const enrollMock = vi.fn().mockResolvedValue({
      data: null,
      error: null,
    });
    requireAuthMock.mockResolvedValueOnce({
      context: {
        accessToken: "token",
        user: { id: "u1" },
        client: { from: vi.fn() },
        authClient: { auth: { mfa: { enroll: enrollMock } } },
      },
    });
    getUserRoleMock.mockResolvedValueOnce({ role: "admin" });

    const response = await POST(
      new Request("http://localhost/api/auth/mfa/totp", {
        method: "POST",
        body: JSON.stringify({ friendlyName: "admin-factor" }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "mfa_enroll_failed",
        message: "MFA enrollment response was incomplete",
      },
    });
  });

  it("rejects invalid verify code", async () => {
    requireAuthMock.mockResolvedValueOnce({
      context: {
        accessToken: "token",
        user: { id: "u1" },
        client: { from: vi.fn() },
        authClient: { auth: { mfa: {} } },
      },
    });
    getUserRoleMock.mockResolvedValueOnce({ role: "admin" });

    const response = await PATCH(
      new Request("http://localhost/api/auth/mfa/totp", {
        method: "PATCH",
        body: JSON.stringify({ factorId: "factor-1", code: "12ab56" }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "invalid_payload",
        message: "valid code is required",
      },
    });
  });

  it("returns 400 when verification response is incomplete", async () => {
    const challengeMock = vi.fn().mockResolvedValue({
      data: { id: "challenge-1" },
      error: null,
    });
    const verifyMock = vi.fn().mockResolvedValue({
      data: null,
      error: null,
    });
    requireAuthMock.mockResolvedValueOnce({
      context: {
        accessToken: "token",
        user: { id: "u1" },
        client: { from: vi.fn() },
        authClient: { auth: { mfa: { challenge: challengeMock, verify: verifyMock } } },
      },
    });
    getUserRoleMock.mockResolvedValueOnce({ role: "admin" });

    const response = await PATCH(
      new Request("http://localhost/api/auth/mfa/totp", {
        method: "PATCH",
        body: JSON.stringify({ factorId: "factor-1", code: "123456" }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "mfa_verify_failed",
        message: "MFA verification response was incomplete",
      },
    });
  });
});
