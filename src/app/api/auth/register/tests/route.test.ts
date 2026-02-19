import { beforeEach, describe, expect, it, vi } from "vitest";

const { isFeatureEnabledMock, createServerSupabaseClientMock } = vi.hoisted(
  () => ({
    isFeatureEnabledMock: vi.fn(),
    createServerSupabaseClientMock: vi.fn(),
  }),
);

vi.mock("@/lib/features/feature-flags", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/features/feature-flags")
  >("@/lib/features/feature-flags");

  return {
    ...actual,
    isFeatureEnabled: isFeatureEnabledMock,
  };
});

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
      body: JSON.stringify({
        email: "x@example.com",
        password: "SecretPass123",
      }),
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

  it("returns 400 for weak passwords", async () => {
    const request = new Request("http://localhost/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email: "x@example.com", password: "weakpass" }),
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "invalid_payload",
        message: "password must be at least 12 characters",
      },
    });
    expect(createServerSupabaseClientMock).not.toHaveBeenCalled();
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
        password: "SecretPass123",
        username: "x",
        locale: "en",
      }),
    });
    const response = await POST(request);

    expect(signUpMock).toHaveBeenCalledWith({
      email: "x@example.com",
      password: "SecretPass123",
      options: {
        emailRedirectTo: "https://app.example.com/auth/confirm?next=/",
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
        password: "SecretPass123",
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

  it("uses accept-language locale when payload locale is missing", async () => {
    const signUpMock = vi.fn().mockResolvedValue({
      data: {
        user: { id: "u2" },
        session: null,
      },
      error: null,
    });
    createServerSupabaseClientMock.mockReturnValue({
      auth: { signUp: signUpMock },
    });

    const request = new Request("http://localhost/api/auth/register", {
      method: "POST",
      headers: { "accept-language": "de-DE,de;q=0.9,en;q=0.8" },
      body: JSON.stringify({
        email: "z@example.com",
        password: "SecretPass123",
        username: "z",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(201);
    expect(signUpMock).toHaveBeenCalledWith({
      email: "z@example.com",
      password: "SecretPass123",
      options: {
        emailRedirectTo: undefined,
        data: {
          username: "z",
          locale: "de",
        },
      },
    });
  });

  it("normalizes email before calling signUp", async () => {
    const signUpMock = vi.fn().mockResolvedValue({
      data: {
        user: { id: "u3" },
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
        email: "  MixedCase@Example.com  ",
        password: "SecretPass123",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(201);
    expect(signUpMock).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "mixedcase@example.com",
      }),
    );
  });
});
