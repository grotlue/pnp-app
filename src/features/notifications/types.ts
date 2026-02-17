export type NotificationId = string;

export type NotificationEventType =
  | "relationship_created"
  | "relationship_updated"
  | "campaign_invite"
  | "campaign_join_request";

export type NotificationPayload = {
  relationship_id?: string;
  source_character_name?: string;
  target_character_name?: string;
  campaign_id?: string;
  campaign_title?: string;
  invited_by_user_id?: string;
  requested_by_user_id?: string;
  membership_id?: string;
};

export type NotificationEntry = {
  id: NotificationId;
  recipient_user_id: string;
  event_type: NotificationEventType;
  source_character_id: string | null;
  target_character_id: string | null;
  payload: NotificationPayload | null;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
};

export type NotificationRpcRow = NotificationEntry;
