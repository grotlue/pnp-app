import { beforeEach, describe, expect, it, vi } from "vitest";

const { createServiceRoleSupabaseClientMock } = vi.hoisted(() => ({
  createServiceRoleSupabaseClientMock: vi.fn(),
}));

vi.mock("@/server/supabase/service-role-client", () => ({
  createServiceRoleSupabaseClient: createServiceRoleSupabaseClientMock,
}));

import { getUserRole } from "../get-user-role";

function createRoleClient(result: { data: { role: string } | null; error: { message: string } | null }) {
  return {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue(result),
        })),
      })),
    })),
  };
}

describe("getUserRole", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns role from user-scoped profile query when available", async () => {
    const userClient = createRoleClient({
      data: { role: "admin" },
      error: null,
    });

    const result = await getUserRole({
      user: { id: "u1" } as never,
      client: userClient as never,
    });

    expect(result).toEqual({ role: "admin" });
    expect(createServiceRoleSupabaseClientMock).not.toHaveBeenCalled();
  });

  it("falls back to service role client when user-scoped role query errors", async () => {
    const userClient = createRoleClient({
      data: null,
      error: { message: "permission denied for table profiles" },
    });
    const serviceClient = createRoleClient({
      data: { role: "admin" },
      error: null,
    });
    createServiceRoleSupabaseClientMock.mockReturnValueOnce(serviceClient);

    const result = await getUserRole({
      user: { id: "u1" } as never,
      client: userClient as never,
    });

    expect(result).toEqual({ role: "admin" });
    expect(createServiceRoleSupabaseClientMock).toHaveBeenCalledTimes(1);
  });

  it("returns original error when fallback cannot be used", async () => {
    const userClient = createRoleClient({
      data: null,
      error: { message: "relation \"profiles\" does not exist" },
    });
    createServiceRoleSupabaseClientMock.mockImplementationOnce(() => {
      throw new Error("Missing environment variable: SUPABASE_SERVICE_ROLE_KEY");
    });

    const result = await getUserRole({
      user: { id: "u1" } as never,
      client: userClient as never,
    });

    expect(result).toEqual({
      role: null,
      errorMessage: "relation \"profiles\" does not exist",
    });
    expect(createServiceRoleSupabaseClientMock).toHaveBeenCalledTimes(1);
  });
});
