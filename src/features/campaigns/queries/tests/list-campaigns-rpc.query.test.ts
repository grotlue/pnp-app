import { describe, expect, it, vi } from "vitest";
import { listCampaignsRpcQuery } from "../list-campaigns-rpc.query";

describe("listCampaignsRpcQuery", () => {
  it("calls campaigns rpc with expected params", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [{ id: "c1", owner_user_id: "u1" }],
      error: null,
    });

    const result = await listCampaignsRpcQuery(
      { rpc },
      {
        scope: "member",
        roleForUserId: "u2",
        limit: 25,
      },
    );

    expect(rpc).toHaveBeenCalledWith("rpc_list_campaigns_for_user", {
      p_scope: "member",
      p_role_for_user_id: "u2",
      p_limit: 25,
    });
    expect(result).toEqual([{ id: "c1", owner_user_id: "u1" }]);
  });

  it("returns empty list when rpc response has null data", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: null,
      error: null,
    });

    await expect(
      listCampaignsRpcQuery(
        { rpc },
        { scope: "all", roleForUserId: null, limit: 100 },
      ),
    ).resolves.toEqual([]);
  });

  it("throws rpc errors", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "rpc failed" },
    });

    await expect(
      listCampaignsRpcQuery(
        { rpc },
        { scope: "public", roleForUserId: null, limit: 10 },
      ),
    ).rejects.toThrow("rpc failed");
  });
});
