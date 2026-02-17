-- Supabase linter follow-up:
-- Drop remaining indexes reported as unused in the current linter output.

drop index if exists public.idx_characters_campaign;
drop index if exists public.idx_character_relationships_owner;
drop index if exists public.idx_character_relationships_target;
drop index if exists public.idx_notifications_recipient_created;
drop index if exists public.idx_campaign_memberships_campaign_state_user;
drop index if exists public.idx_relationship_timeline_relationship_occurred_desc;
drop index if exists public.idx_campaign_memberships_user;
