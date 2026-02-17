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

describe("admin campaign detail route", () => {
  it("updates campaign", async () => {
    requireAdminMock.mockResolvedValueOnce({
      context: { user: { id: "admin-1" } },
    });
    const singleMock = vi.fn().mockResolvedValue({
      data: {
        id: "c1",
        owner_user_id: "u2",
        title: "Updated",
        description: "",
      },
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
      new Request("http://localhost/api/admin/campaigns/c1", {
        method: "PATCH",
        body: JSON.stringify({ title: "Updated", ownerUserId: "u2" }),
      }),
      { params: Promise.resolve({ campaignId: "c1" }) },
    );
    expect(response.status).toBe(200);
  });

  it("deletes campaign", async () => {
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
      new Request("http://localhost/api/admin/campaigns/c1"),
      {
        params: Promise.resolve({ campaignId: "c1" }),
      },
    );
    expect(eqMock).toHaveBeenCalledWith("id", "c1");
    expect(response.status).toBe(200);
  });
});
