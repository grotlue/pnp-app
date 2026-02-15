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

describe("admin campaigns route", () => {
  it("lists campaigns", async () => {
    requireAdminMock.mockResolvedValueOnce({ context: { user: { id: "admin-1" } } });
    createServiceRoleSupabaseClientMock.mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn().mockResolvedValue({
              data: [{ id: "c1", owner_user_id: "u1", title: "T", description: "" }],
              error: null,
            }),
          })),
        })),
      })),
    });

    const response = await GET(new Request("http://localhost/api/admin/campaigns"));
    expect(response.status).toBe(200);
  });

  it("creates campaign with owner", async () => {
    requireAdminMock.mockResolvedValueOnce({ context: { user: { id: "admin-1" } } });
    const singleMock = vi.fn().mockResolvedValue({
      data: { id: "c1", owner_user_id: "u1", title: "T", description: "" },
      error: null,
    });
    createServiceRoleSupabaseClientMock.mockReturnValue({
      from: vi.fn(() => ({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: singleMock,
          })),
        })),
      })),
    });

    const response = await POST(
      new Request("http://localhost/api/admin/campaigns", {
        method: "POST",
        body: JSON.stringify({ ownerUserId: "u1", title: "T", description: "" }),
      }),
    );
    expect(response.status).toBe(201);
  });
});
