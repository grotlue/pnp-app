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

describe("admin character detail route", () => {
  it("updates character", async () => {
    requireAdminMock.mockResolvedValueOnce({
      context: { user: { id: "admin-1" } },
    });
    const singleMock = vi.fn().mockResolvedValue({
      data: { id: "ch1", owner_user_id: "u2", type: "npc", name: "Updated" },
      error: null,
    });
    createServiceRoleSupabaseClientMock.mockReturnValue({
      from: vi.fn(() => ({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: singleMock,
            })),
          })),
        })),
      })),
    });

    const response = await PATCH(
      new Request("http://localhost/api/admin/characters/ch1", {
        method: "PATCH",
        body: JSON.stringify({ name: "Updated", ownerUserId: "u2" }),
      }),
      { params: Promise.resolve({ characterId: "ch1" }) },
    );
    expect(response.status).toBe(200);
  });

  it("deletes character", async () => {
    requireAdminMock.mockResolvedValueOnce({
      context: { user: { id: "admin-1" } },
    });
    const eqMock = vi.fn().mockResolvedValue({ error: null });
    createServiceRoleSupabaseClientMock.mockReturnValue({
      from: vi.fn(() => ({
        delete: vi.fn(() => ({
          eq: eqMock,
        })),
      })),
    });

    const response = await DELETE(
      new Request("http://localhost/api/admin/characters/ch1"),
      {
        params: Promise.resolve({ characterId: "ch1" }),
      },
    );
    expect(eqMock).toHaveBeenCalledWith("id", "ch1");
    expect(response.status).toBe(200);
  });
});
