import { beforeEach, describe, expect, it, vi } from "vitest";

const { isFeatureEnabledMock, createServerSupabaseClientMock } = vi.hoisted(() => ({
  isFeatureEnabledMock: vi.fn(),
  createServerSupabaseClientMock: vi.fn(),
}));

vi.mock("@/lib/features/feature-flags", () => ({
  isFeatureEnabled: isFeatureEnabledMock,
}));

vi.mock("@/server/supabase/server-client", () => ({
  createServerSupabaseClient: createServerSupabaseClientMock,
}));

import { POST } from "../route";

beforeEach(() => {
  vi.clearAllMocks();
  isFeatureEnabledMock.mockReturnValue(true);
});

describe("POST /api/auth/register", () => {
  it("returns 404 when self-registration feature is disabled", async () => {
    isFeatureEnabledMock.mockReturnValue(false);

    const request = new Request("http://localhost/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email: "x@example.com", password: "secret" }),
    });
    const response = await POST(request);

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "not_found",
        message: "Not Found",
      },
    });
    expect(createServerSupabaseClientMock).not.toHaveBeenCalled();
  });

  it("returns 400 for invalid payload", async () => {
    const request = new Request("http://localhost/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email: "x@example.com" }),
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "invalid_payload",
        message: "email and password are required",
      },
    });
  });

  it("returns 400 when supabase signUp fails", async () => {
    const signUpMock = vi.fn().mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "already registered" },
    });
    createServerSupabaseClientMock.mockReturnValue({
      auth: { signUp: signUpMock },
    });

    const request = new Request("http://localhost/api/auth/register", {
      method: "POST",
      headers: { origin: "https://app.example.com" },
      body: JSON.stringify({
        email: "x@example.com",
        password: "secret",
        username: "x",
        locale: "en",
      }),
    });
    const response = await POST(request);

    expect(signUpMock).toHaveBeenCalledWith({
      email: "x@example.com",
      password: "secret",
      options: {
        emailRedirectTo: "https://app.example.com/auth/callback",
        data: {
          username: "x",
          locale: "en",
        },
      },
    });
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "register_failed",
        message: "already registered",
      },
    });
  });

  it("returns 201 and email verification requirement on success", async () => {
    const signUpMock = vi.fn().mockResolvedValue({
      data: {
        user: { id: "u1" },
        session: null,
      },
      error: null,
    });
    createServerSupabaseClientMock.mockReturnValue({
      auth: { signUp: signUpMock },
    });

    const request = new Request("http://localhost/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: "x@example.com",
        password: "secret",
        username: "x",
        locale: "de",
      }),
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body).toEqual({
      data: {
        user: { id: "u1" },
        session: null,
        emailVerificationRequired: true,
      },
    });
  });
});
