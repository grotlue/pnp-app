import { describe, expect, it } from "vitest";
import { mapNotificationRpcRow } from "../map-notification-rpc-row.logic";

describe("mapNotificationRpcRow", () => {
  it("normalizes rpc notification payload to nullable value", () => {
    const result = mapNotificationRpcRow({
      id: "n1",
      recipient_user_id: "u1",
      event_type: "campaign_invite",
      source_character_id: null,
      target_character_id: null,
      payload: null,
      is_read: false,
      created_at: "2026-02-17T12:00:00.000Z",
      read_at: null,
    });

    expect(result).toEqual({
      id: "n1",
      recipient_user_id: "u1",
      event_type: "campaign_invite",
      source_character_id: null,
      target_character_id: null,
      payload: null,
      is_read: false,
      created_at: "2026-02-17T12:00:00.000Z",
      read_at: null,
    });
  });
});
