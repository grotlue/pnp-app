export type RelationshipId = string;

export type RelationshipCatalog = {
  categories: Array<{ id: number; key: string; sort_order: number }>;
  labels: Array<{ id: number; key: string; sort_order: number }>;
};

export type RelationshipSummary = {
  other_character_id: string | null;
  other_character_name: string;
  other_character_deleted: boolean;
};

export type OutgoingRelationship = {
  id: string;
  source_character_id: string;
  target_character_id: string | null;
  category_id: number;
  label_preset_id: number | null;
  label_custom: string | null;
  description: string;
  target_snapshot_name: string | null;
  target_name: string | null;
  is_external_target: boolean;
};

export type RelationshipTimelineEntry = {
  id: string;
  occurred_at: string;
  content: string;
};

export type RelationshipDetail = {
  outgoing: OutgoingRelationship | null;
  incoming: OutgoingRelationship | null;
  timeline: RelationshipTimelineEntry[];
};
