import { describe, expect, it } from "vitest";
import {
  getNotificationDisplayTitle,
  getNotificationEventLabel,
  getNotificationMembershipTarget,
  getNotificationUnreadCount,
  getNotificationViewPath,
} from "../notification-list.logic";
import type { NotificationEntry } from "@/features/notifications/types";

const t = (key: string) => key;

function makeNotification(input?: Partial<NotificationEntry>): NotificationEntry {
  return {
    id: "n1",
    recipient_user_id: "u1",
    event_type: "campaign_invite",
    source_character_id: null,
    target_character_id: null,
    payload: null,
    is_read: false,
    created_at: "2026-02-15T00:00:00.000Z",
    read_at: null,
    ...input,
  };
}

describe("notification-list logic", () => {
  it("counts unread notifications", () => {
    const notifications = [
      makeNotification({ id: "a", is_read: false }),
      makeNotification({ id: "b", is_read: true }),
      makeNotification({ id: "c", is_read: false }),
    ];

    expect(getNotificationUnreadCount(notifications)).toBe(2);
  });

  it("resolves membership target only when campaign and membership ids exist", () => {
    expect(
      getNotificationMembershipTarget(
        makeNotification({
          payload: { campaign_id: "c1", membership_id: "m1" },
        }),
      ),
    ).toEqual({
      campaignId: "c1",
      membershipId: "m1",
    });

    expect(
      getNotificationMembershipTarget(
        makeNotification({
          payload: { campaign_id: "c1" },
        }),
      ),
    ).toBeNull();
  });

  it("prefers campaign path and falls back to target character path", () => {
    expect(
      getNotificationViewPath(
        makeNotification({
          payload: { campaign_id: "c1" },
          target_character_id: "char1",
        }),
      ),
    ).toBe("/campaigns/c1");

    expect(
      getNotificationViewPath(
        makeNotification({
          event_type: "relationship_updated",
          target_character_id: "char1",
        }),
      ),
    ).toBe("/characters/char1");
  });

  it("builds campaign and relationship display titles", () => {
    expect(
      getNotificationDisplayTitle(
        makeNotification({
          event_type: "campaign_invite",
          payload: { campaign_title: "Dragonfall" },
        }),
        t,
      ),
    ).toBe("ui.notifications.events.campaignInvite: Dragonfall");

    expect(
      getNotificationDisplayTitle(
        makeNotification({
          event_type: "relationship_created",
          payload: {
            source_character_name: "Aria",
            target_character_name: "Borin",
          },
        }),
        t,
      ),
    ).toBe("Aria -> Borin");
  });

  it("returns event labels by event type", () => {
    expect(
      getNotificationEventLabel(
        makeNotification({
          event_type: "campaign_join_request",
        }),
        t,
      ),
    ).toBe("ui.notifications.events.campaignJoinRequest");
    expect(
      getNotificationEventLabel(
        makeNotification({
          event_type: "relationship_updated",
        }),
        t,
      ),
    ).toBe("ui.notifications.events.relationshipUpdated");
  });
});
