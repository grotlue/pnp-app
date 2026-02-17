import type {
  NotificationEntry,
  NotificationRpcRow,
} from "@/features/notifications/types";

export function mapNotificationRpcRow(
  row: NotificationRpcRow,
): NotificationEntry {
  return {
    id: row.id,
    recipient_user_id: row.recipient_user_id,
    event_type: row.event_type,
    source_character_id: row.source_character_id,
    target_character_id: row.target_character_id,
    payload: row.payload ?? null,
    is_read: row.is_read,
    created_at: row.created_at,
    read_at: row.read_at,
  };
}
