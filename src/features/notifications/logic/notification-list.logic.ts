import type {
  NotificationEntry,
  NotificationPayload,
} from "@/features/notifications/types";

function payloadString(
  payload: NotificationPayload | null,
  key: keyof NotificationPayload,
) {
  const value = payload?.[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

export function getNotificationUnreadCount(notifications: NotificationEntry[]) {
  return notifications.filter((entry) => !entry.is_read).length;
}

export function getNotificationMembershipTarget(
  notification: NotificationEntry,
) {
  const campaignId = payloadString(notification.payload, "campaign_id");
  const membershipId = payloadString(notification.payload, "membership_id");
  if (!campaignId || !membershipId) {
    return null;
  }

  return { campaignId, membershipId };
}

export function getNotificationViewPath(notification: NotificationEntry) {
  const campaignId = payloadString(notification.payload, "campaign_id");
  if (campaignId) {
    return `/campaigns/${campaignId}`;
  }

  if (notification.target_character_id) {
    return `/characters/${notification.target_character_id}`;
  }

  return null;
}

export function getNotificationDisplayTitle(
  notification: NotificationEntry,
  t: (key: string, fallback?: string) => string,
) {
  const campaignTitle = payloadString(notification.payload, "campaign_title");
  const sourceName = payloadString(
    notification.payload,
    "source_character_name",
  );
  const targetName = payloadString(
    notification.payload,
    "target_character_name",
  );

  if (notification.event_type === "campaign_invite") {
    return campaignTitle
      ? `${t("ui.notifications.events.campaignInvite")}: ${campaignTitle}`
      : t("ui.notifications.events.campaignInvite");
  }

  if (notification.event_type === "campaign_join_request") {
    return campaignTitle
      ? `${t("ui.notifications.events.campaignJoinRequest")}: ${campaignTitle}`
      : t("ui.notifications.events.campaignJoinRequest");
  }

  if (notification.event_type === "relationship_created") {
    if (sourceName && targetName) {
      return `${sourceName} -> ${targetName}`;
    }
    return t("ui.notifications.events.relationshipCreated");
  }

  if (sourceName && targetName) {
    return `${sourceName} -> ${targetName}`;
  }
  return t("ui.notifications.events.relationshipUpdated");
}

export function getNotificationEventLabel(
  notification: NotificationEntry,
  t: (key: string, fallback?: string) => string,
) {
  if (notification.event_type === "campaign_invite") {
    return t("ui.notifications.events.campaignInvite");
  }

  if (notification.event_type === "campaign_join_request") {
    return t("ui.notifications.events.campaignJoinRequest");
  }

  if (notification.event_type === "relationship_created") {
    return t("ui.notifications.events.relationshipCreated");
  }

  return t("ui.notifications.events.relationshipUpdated");
}
