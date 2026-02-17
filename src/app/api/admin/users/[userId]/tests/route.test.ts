import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireAdminMock, createServiceRoleSupabaseClientMock } = vi.hoisted(
  () => ({
    requireAdminMock: vi.fn(),
    createServiceRoleSupabaseClientMock: vi.fn(),
  }),
);

vi.mock("@/server/auth/require-admin", () => ({
  requireAdmin: requireAdminMock,
}));

vi.mock("@/server/supabase/service-role-client", () => ({
  createServiceRoleSupabaseClient: createServiceRoleSupabaseClientMock,
}));

import { DELETE, PATCH } from "../route";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("admin user detail route", () => {
  it("updates user profile and auth fields", async () => {
    const updateEqMock = vi.fn().mockResolvedValue({ error: null });
    requireAdminMock.mockResolvedValueOnce({
      context: { user: { id: "admin-1" } },
    });

    const updateUserByIdMock = vi.fn().mockResolvedValue({ error: null });
    const maybeSingleMock = vi.fn().mockResolvedValue({
      data: { role: "user" },
      error: null,
    });
    createServiceRoleSupabaseClientMock.mockReturnValue({
      auth: { admin: { updateUserById: updateUserByIdMock } },
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: maybeSingleMock,
          })),
        })),
        update: vi.fn(() => ({
          eq: updateEqMock,
        })),
      })),
    });

    const response = await PATCH(
      new Request("http://localhost/api/admin/users/u2", {
        method: "PATCH",
        body: JSON.stringify({
          email: "u2@example.com",
          password: "SecretPass123",
          username: "user2",
          description: "updated",
          locale: "de",
        }),
      }),
      { params: Promise.resolve({ userId: "u2" }) },
    );

    expect(updateUserByIdMock).toHaveBeenCalledWith("u2", {
      email: "u2@example.com",
      password: "SecretPass123",
    });
    expect(updateEqMock).toHaveBeenCalledWith("id", "u2");
    expect(response.status).toBe(200);
  });

  it("returns 500 when service role client is unavailable for update", async () => {
    requireAdminMock.mockResolvedValueOnce({
      context: { user: { id: "admin-1" } },
    });
    createServiceRoleSupabaseClientMock.mockImplementationOnce(() => {
      throw new Error(
        "Missing environment variable: SUPABASE_SERVICE_ROLE_KEY",
      );
    });

    const response = await PATCH(
      new Request("http://localhost/api/admin/users/u2", {
        method: "PATCH",
        body: JSON.stringify({
          username: "user2",
        }),
      }),
      { params: Promise.resolve({ userId: "u2" }) },
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "admin_user_update_failed",
        message: "Failed to update user",
      },
    });
  });

  it("blocks updating admin accounts", async () => {
    requireAdminMock.mockResolvedValueOnce({
      context: { user: { id: "admin-1" } },
    });

    const updateUserByIdMock = vi.fn();
    createServiceRoleSupabaseClientMock.mockReturnValue({
      auth: { admin: { updateUserById: updateUserByIdMock } },
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
    });

    const response = await PATCH(
      new Request("http://localhost/api/admin/users/admin-2", {
        method: "PATCH",
        body: JSON.stringify({
          username: "new-name",
        }),
      }),
      { params: Promise.resolve({ userId: "admin-2" }) },
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "admin_user_update_forbidden",
        message: "Admin accounts cannot be edited",
      },
    });
    expect(updateUserByIdMock).not.toHaveBeenCalled();
  });

  it("rejects weak password updates", async () => {
    requireAdminMock.mockResolvedValueOnce({
      context: { user: { id: "admin-1" } },
    });

    const updateUserByIdMock = vi.fn();
    createServiceRoleSupabaseClientMock.mockReturnValue({
      auth: { admin: { updateUserById: updateUserByIdMock } },
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
    });

    const response = await PATCH(
      new Request("http://localhost/api/admin/users/u2", {
        method: "PATCH",
        body: JSON.stringify({
          password: "weakpass",
        }),
      }),
      { params: Promise.resolve({ userId: "u2" }) },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "invalid_payload",
        message: "password must be at least 12 characters",
      },
    });
    expect(updateUserByIdMock).not.toHaveBeenCalled();
  });

  it("blocks deleting admin accounts", async () => {
    requireAdminMock.mockResolvedValueOnce({
      context: {
        user: { id: "admin-1" },
        client: {
          rpc: vi.fn(),
        },
      },
    });
    createServiceRoleSupabaseClientMock.mockReturnValue({
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
    });

    const response = await DELETE(
      new Request("http://localhost/api/admin/users/admin-2"),
      {
        params: Promise.resolve({ userId: "admin-2" }),
      },
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "admin_delete_failed",
        message: "Admin accounts cannot be deleted",
      },
    });
  });
});
