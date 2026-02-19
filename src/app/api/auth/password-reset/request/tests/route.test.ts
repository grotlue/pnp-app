import { beforeEach, describe, expect, it, vi } from "vitest";

const { createServerSupabaseClientMock, createServiceRoleSupabaseClientMock } =
  vi.hoisted(() => ({
    createServerSupabaseClientMock: vi.fn(),
    createServiceRoleSupabaseClientMock: vi.fn(),
  }));

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
});

describe("POST /api/auth/password-reset/request", () => {
  it("returns 400 for invalid payload", async () => {
    const request = new Request(
      "http://localhost/api/auth/password-reset/request",
      {
        method: "POST",
        body: JSON.stringify({}),
      },
    );

    const response = await POST(request);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "invalid_payload",
        message: "email is required",
      },
    });
  });

  it("uses email reset endpoint when preview email delivery is enabled", async () => {
    process.env.APP_ENV = "development";

    const resetPasswordForEmailMock = vi.fn().mockResolvedValue({
      error: null,
    });
    createServerSupabaseClientMock.mockReturnValue({
      auth: { resetPasswordForEmail: resetPasswordForEmailMock },
    });

    const request = new Request(
      "http://localhost/api/auth/password-reset/request",
      {
        method: "POST",
        headers: { origin: "https://app.example.com" },
        body: JSON.stringify({ email: "x@example.com" }),
      },
    );

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(resetPasswordForEmailMock).toHaveBeenCalledWith("x@example.com", {
      redirectTo: "https://app.example.com/auth/reset-password",
    });
    await expect(response.json()).resolves.toEqual({
      data: { requested: true },
    });
  });

  it("returns preview recovery link instead of sending email in preview", async () => {
    process.env.APP_ENV = "preview";

    const generateLinkMock = vi.fn().mockResolvedValue({
      data: {
        properties: {
          action_link: "https://preview.example.com/recovery-link",
        },
      },
      error: null,
    });
    createServiceRoleSupabaseClientMock.mockReturnValue({
      auth: { admin: { generateLink: generateLinkMock } },
    });
    createServerSupabaseClientMock.mockReturnValue({
      auth: { resetPasswordForEmail: vi.fn() },
    });

    const request = new Request(
      "http://localhost/api/auth/password-reset/request",
      {
        method: "POST",
        headers: { origin: "https://app.example.com" },
        body: JSON.stringify({ email: "x@example.com" }),
      },
    );

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(generateLinkMock).toHaveBeenCalledWith({
      type: "recovery",
      email: "x@example.com",
      options: {
        redirectTo: "https://app.example.com/auth/reset-password",
      },
    });
    await expect(response.json()).resolves.toEqual({
      data: {
        requested: true,
        previewRecoveryLink: "https://preview.example.com/recovery-link",
      },
    });
  });
});
