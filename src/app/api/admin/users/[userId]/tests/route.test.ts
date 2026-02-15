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

import { DELETE, PATCH } from "../route";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("admin user detail route", () => {
  it("updates user profile and auth fields", async () => {
    requireAdminMock.mockResolvedValueOnce({
      context: { user: { id: "admin-1" } },
    });

    const updateUserByIdMock = vi.fn().mockResolvedValue({ error: null });
    const updateMock = vi.fn().mockResolvedValue({ error: null });
    createServiceRoleSupabaseClientMock.mockReturnValue({
      auth: { admin: { updateUserById: updateUserByIdMock } },
      from: vi.fn(() => ({
        update: vi.fn(() => ({
          eq: updateMock,
        })),
      })),
    });

    const response = await PATCH(
      new Request("http://localhost/api/admin/users/u2", {
        method: "PATCH",
        body: JSON.stringify({
          email: "u2@example.com",
          password: "Secret123!",
          username: "user2",
          description: "updated",
          locale: "de",
        }),
      }),
      { params: Promise.resolve({ userId: "u2" }) },
    );

    expect(updateUserByIdMock).toHaveBeenCalledWith("u2", {
      email: "u2@example.com",
      password: "Secret123!",
    });
    expect(updateMock).toHaveBeenCalledWith("id", "u2");
    expect(response.status).toBe(200);
  });

  it("blocks deleting own admin user", async () => {
    requireAdminMock.mockResolvedValueOnce({
      context: {
        user: { id: "admin-1" },
        client: {
          rpc: vi.fn(),
        },
      },
    });

    const response = await DELETE(new Request("http://localhost/api/admin/users/admin-1"), {
      params: Promise.resolve({ userId: "admin-1" }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "admin_delete_failed",
        message: "Admin cannot delete own account",
      },
    });
  });
});
