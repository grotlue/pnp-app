import { describe, expect, it } from "vitest";
import { mapCampaignRpcRow } from "../map-campaign-rpc-row.logic";

describe("mapCampaignRpcRow", () => {
  it("maps rpc rows to campaign DTO shape", () => {
    const result = mapCampaignRpcRow({
      id: "c1",
      owner_user_id: "u1",
      title: "Dragonfall",
      description: "desc",
      is_private: false,
      created_at: "2026-02-17T12:00:00.000Z",
      updated_at: "2026-02-17T13:00:00.000Z",
      owner_username: "owner",
      owner_role: "user",
      player_count: 2,
      current_user_role: "owner",
      role_for_user: "player",
    });

    expect(result).toEqual({
      id: "c1",
      owner_user_id: "u1",
      title: "Dragonfall",
      description: "desc",
      is_private: false,
      created_at: "2026-02-17T12:00:00.000Z",
      updated_at: "2026-02-17T13:00:00.000Z",
      owner_username: "owner",
      owner_role: "user",
      player_count: 2,
      current_user_role: "owner",
      role_for_user: "player",
    });
  });
});
