import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  isFeatureEnabledMock,
  createServerSupabaseClientMock,
  createServiceRoleSupabaseClientMock,
} = vi.hoisted(() => ({
  isFeatureEnabledMock: vi.fn(),
  createServerSupabaseClientMock: vi.fn(),
  createServiceRoleSupabaseClientMock: vi.fn(),
}));

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

vi.mock("@/server/supabase/service-role-client", () => ({
  createServiceRoleSupabaseClient: createServiceRoleSupabaseClientMock,
}));

import { POST } from "../route";

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.APP_ENV;
  delete process.env.PREVIEW_AUTH_EMAILS_DISABLED;
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
        emailRedirectTo: "http://localhost/auth/confirm?next=/",
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

  it("uses preview no-email registration fallback when enabled", async () => {
    process.env.APP_ENV = "preview";

    const createUserMock = vi.fn().mockResolvedValue({
      data: { user: { id: "u-preview" } },
      error: null,
    });
    const signInWithPasswordMock = vi.fn().mockResolvedValue({
      data: {
        user: { id: "u-preview" },
        session: {
          access_token: "at-preview",
          refresh_token: "rt-preview",
          expires_at: 123,
        },
      },
      error: null,
    });

    createServiceRoleSupabaseClientMock.mockReturnValue({
      auth: { admin: { createUser: createUserMock } },
    });
    createServerSupabaseClientMock.mockReturnValue({
      auth: { signInWithPassword: signInWithPasswordMock },
    });

    const request = new Request("http://localhost/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: "preview@example.com",
        password: "SecretPass123",
        username: "preview-user",
        locale: "en",
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(createUserMock).toHaveBeenCalledWith({
      email: "preview@example.com",
      password: "SecretPass123",
      email_confirm: true,
      user_metadata: {
        username: "preview-user",
        locale: "en",
      },
    });
    expect(signInWithPasswordMock).toHaveBeenCalledWith({
      email: "preview@example.com",
      password: "SecretPass123",
    });
    expect(body).toEqual({
      data: {
        user: { id: "u-preview" },
        session: {
          access_token: "at-preview",
          refresh_token: "rt-preview",
          expires_at: 123,
        },
        emailVerificationRequired: false,
      },
    });
    expect(response.headers.get("set-cookie")).toContain("pnp_access_token");
  });
});
