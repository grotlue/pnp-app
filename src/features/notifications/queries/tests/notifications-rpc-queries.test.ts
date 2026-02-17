import { describe, expect, it, vi } from "vitest";
import { listNotificationsRpcQuery } from "../list-notifications-rpc.query";
import { countUnreadNotificationsRpcQuery } from "../count-unread-notifications-rpc.query";

describe("notifications rpc queries", () => {
  it("calls notifications list rpc with defaults", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [{ id: "n1" }],
      error: null,
    });

    const result = await listNotificationsRpcQuery({ rpc }, { limit: 100 });
    expect(result).toEqual([{ id: "n1" }]);
    expect(rpc).toHaveBeenCalledWith("rpc_list_notifications_for_user", {
      p_limit: 100,
      p_only_unread: false,
    });
  });

  it("calls notifications list rpc with unread filter", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [],
      error: null,
    });

    await listNotificationsRpcQuery({ rpc }, { limit: 25, onlyUnread: true });
    expect(rpc).toHaveBeenCalledWith("rpc_list_notifications_for_user", {
      p_limit: 25,
      p_only_unread: true,
    });
  });

  it("throws list rpc errors", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "list failed" },
    });

    await expect(
      listNotificationsRpcQuery({ rpc }, { limit: 10 }),
    ).rejects.toThrow("list failed");
  });

  it("returns numeric unread count from rpc", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: 4,
      error: null,
    });

    await expect(countUnreadNotificationsRpcQuery({ rpc })).resolves.toBe(4);
  });

  it("parses unread count from string and falls back for invalid data", async () => {
    const rpcAsString = vi.fn().mockResolvedValue({
      data: "7",
      error: null,
    });
    await expect(
      countUnreadNotificationsRpcQuery({ rpc: rpcAsString }),
    ).resolves.toBe(7);

    const rpcAsInvalid = vi.fn().mockResolvedValue({
      data: "NaN",
      error: null,
    });
    await expect(
      countUnreadNotificationsRpcQuery({ rpc: rpcAsInvalid }),
    ).resolves.toBe(0);
  });
});
