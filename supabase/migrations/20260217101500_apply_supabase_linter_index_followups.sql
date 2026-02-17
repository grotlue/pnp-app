-- Supabase linter follow-up:
-- 1) Ensure FK covering indexes exist (idempotent).
-- 2) Remove redundant/unused indexes that are fully covered by other keys.

create index if not exists idx_character_relationships_category
on public.character_relationships(category_id);

create index if not exists idx_character_relationships_label_preset
on public.character_relationships(label_preset_id);

create index if not exists idx_notifications_source_character
on public.notifications(source_character_id);

create index if not exists idx_notifications_target_character
on public.notifications(target_character_id);

create index if not exists idx_relationship_timeline_entries_owner
on public.relationship_timeline_entries(owner_user_id);

-- Redundant with primary-key access patterns and currently unused.
drop index if exists public.idx_campaigns_owner;

-- Redundant because unique(campaign_id, user_id) already covers campaign_id lookups.
drop index if exists public.idx_campaign_memberships_campaign;

-- Redundant because idx_relationship_timeline_relationship_occurred_desc
-- already covers lookups by relationship_id.
drop index if exists public.idx_relationship_timeline_relationship;
