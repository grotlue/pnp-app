import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireAdminMock, createServiceRoleSupabaseClientMock } = vi.hoisted(() => ({
  requireAdminMock: vi.fn(),
  createServiceRoleSupabaseClientMock: vi.fn(),
}));

vi.mock("@/server/auth/require-admin", () => ({
  requireAdmin: requireAdminMock,
}));

vi.mock("@/server/supabase/service-role-client", () => ({
  createServiceRoleSupabaseClient: createServiceRoleSupabaseClientMock,
}));

import { GET, POST } from "../route";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("admin users route", () => {
  it("returns early when requireAdmin denies access", async () => {
    const deniedResponse = Response.json({ error: { code: "admin_required" } }, { status: 403 });
    requireAdminMock.mockResolvedValueOnce({ response: deniedResponse });

    const response = await GET(new Request("http://localhost/api/admin/users"));
    expect(response.status).toBe(403);
  });

  it("lists users with merged profile + auth email", async () => {
    requireAdminMock.mockResolvedValueOnce({ context: { user: { id: "admin-1" } } });

    const serviceClient = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          order: vi.fn().mockResolvedValue({
            data: [
              {
                id: "u1",
                username: "user1",
                description: "",
                role: "user",
                locale: "en",
                created_at: "2026-01-01",
                updated_at: "2026-01-01",
              },
            ],
            error: null,
          }),
        })),
      })),
      auth: {
        admin: {
          listUsers: vi.fn().mockResolvedValue({
            data: {
              users: [{ id: "u1", email: "user1@example.com" }],
              nextPage: null,
            },
            error: null,
          }),
        },
      },
    };
    createServiceRoleSupabaseClientMock.mockReturnValue(serviceClient);

    const response = await GET(new Request("http://localhost/api/admin/users"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      data: [
        {
          id: "u1",
          username: "user1",
          description: "",
          role: "user",
          locale: "en",
          created_at: "2026-01-01",
          updated_at: "2026-01-01",
          email: "user1@example.com",
        },
      ],
    });
  });

  it("rejects invalid create payload", async () => {
    requireAdminMock.mockResolvedValueOnce({ context: { user: { id: "admin-1" } } });

    const response = await POST(
      new Request("http://localhost/api/admin/users", {
        method: "POST",
        body: JSON.stringify({ email: "u@example.com" }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "invalid_payload",
        message: "email, password, and username are required",
      },
    });
  });

  it("creates user and upserts profile", async () => {
    requireAdminMock.mockResolvedValueOnce({ context: { user: { id: "admin-1" } } });

    const upsertMock = vi.fn().mockResolvedValue({ error: null });
    const serviceClient = {
      auth: {
        admin: {
          createUser: vi.fn().mockResolvedValue({
            data: { user: { id: "u2" } },
            error: null,
          }),
        },
      },
      from: vi.fn(() => ({
        upsert: upsertMock,
      })),
    };
    createServiceRoleSupabaseClientMock.mockReturnValue(serviceClient);

    const response = await POST(
      new Request("http://localhost/api/admin/users", {
        method: "POST",
        body: JSON.stringify({
          email: "u2@example.com",
          password: "Secret123!",
          username: "user2",
          description: "desc",
          locale: "de",
        }),
      }),
    );
    const body = await response.json();

    expect(serviceClient.auth.admin.createUser).toHaveBeenCalledWith({
      email: "u2@example.com",
      password: "Secret123!",
      email_confirm: true,
      user_metadata: { username: "user2", locale: "de" },
    });
    expect(upsertMock).toHaveBeenCalled();
    expect(response.status).toBe(201);
    expect(body).toEqual({
      data: {
        userId: "u2",
      },
    });
  });

  it("returns structured 500 when user creation throws unexpectedly", async () => {
    requireAdminMock.mockResolvedValueOnce({ context: { user: { id: "admin-1" } } });
    createServiceRoleSupabaseClientMock.mockImplementationOnce(() => {
      throw new Error("Missing environment variable: SUPABASE_SERVICE_ROLE_KEY");
    });

    const response = await POST(
      new Request("http://localhost/api/admin/users", {
        method: "POST",
        body: JSON.stringify({
          email: "u2@example.com",
          password: "Secret123!",
          username: "user2",
          locale: "de",
        }),
      }),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "admin_user_create_failed",
        message: "Missing environment variable: SUPABASE_SERVICE_ROLE_KEY",
      },
    });
  });
});
