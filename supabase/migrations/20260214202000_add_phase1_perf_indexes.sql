-- Performance indexes for high-frequency list/read patterns.
create index if not exists idx_campaigns_created_at_desc
on public.campaigns (created_at desc);

create index if not exists idx_characters_created_at_desc
on public.characters (created_at desc);

create index if not exists idx_campaign_memberships_campaign_state_user
on public.campaign_memberships (campaign_id, state, user_id);

create index if not exists idx_relationship_timeline_relationship_occurred_desc
on public.relationship_timeline_entries (relationship_id, occurred_at desc);

create index if not exists idx_notifications_recipient_read_created_desc
on public.notifications (recipient_user_id, is_read, created_at desc);
