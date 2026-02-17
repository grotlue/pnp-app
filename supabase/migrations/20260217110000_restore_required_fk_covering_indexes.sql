-- Restore FK-covering indexes required by schema guardrails.

create index if not exists idx_campaign_memberships_user
on public.campaign_memberships(user_id);

create index if not exists idx_campaigns_owner
on public.campaigns(owner_user_id);

create index if not exists idx_character_relationships_owner
on public.character_relationships(owner_user_id);

create index if not exists idx_character_relationships_target
on public.character_relationships(target_character_id);

create index if not exists idx_relationship_timeline_relationship_occurred_desc
on public.relationship_timeline_entries(relationship_id, occurred_at desc);
