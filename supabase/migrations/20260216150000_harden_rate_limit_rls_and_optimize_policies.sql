-- Security: harden rate-limit storage table in exposed schema.
alter table public.api_rate_limits enable row level security;

revoke all on table public.api_rate_limits from anon;
revoke all on table public.api_rate_limits from authenticated;
grant select, insert, update, delete on table public.api_rate_limits to service_role;

drop policy if exists "Service role can manage api rate limits" on public.api_rate_limits;
create policy "Service role can manage api rate limits"
on public.api_rate_limits
for all
to service_role
using (true)
with check (true);

-- Performance: avoid re-evaluating auth context per row in RLS policies.
drop policy if exists "Authenticated users can read profiles" on public.profiles;
create policy "Authenticated users can read profiles"
on public.profiles
for select
using ((select auth.uid()) is not null);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
on public.profiles
for insert
with check ((select auth.uid()) = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles
for update
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists "Users can read visible campaigns" on public.campaigns;
create policy "Users can read visible campaigns"
on public.campaigns
for select
using (public.can_view_campaign(id, (select auth.uid())));

drop policy if exists "Users can create own campaigns" on public.campaigns;
create policy "Users can create own campaigns"
on public.campaigns
for insert
with check ((select auth.uid()) = owner_user_id);

drop policy if exists "Owners can update campaigns" on public.campaigns;
drop policy if exists "Admins can update public campaigns" on public.campaigns;
create policy "Owners or admins can update campaigns"
on public.campaigns
for update
using (
  (select auth.uid()) = owner_user_id
  or (
    public.is_admin((select auth.uid()))
    and is_private = false
  )
)
with check (
  (select auth.uid()) = owner_user_id
  or (
    public.is_admin((select auth.uid()))
    and is_private = false
  )
);

drop policy if exists "Owners can delete campaigns" on public.campaigns;
drop policy if exists "Admins can delete public campaigns" on public.campaigns;
create policy "Owners or admins can delete campaigns"
on public.campaigns
for delete
using (
  (select auth.uid()) = owner_user_id
  or (
    public.is_admin((select auth.uid()))
    and is_private = false
  )
);

drop policy if exists "Users can read related memberships" on public.campaign_memberships;
create policy "Users can read related memberships"
on public.campaign_memberships
for select
using (
  (select auth.uid()) = user_id
  or public.can_view_campaign(campaign_id, (select auth.uid()))
);

drop policy if exists "Users can create own requests or owner invites" on public.campaign_memberships;
create policy "Users can create own requests or owner invites"
on public.campaign_memberships
for insert
with check (
  (select auth.uid()) = user_id
  or public.is_campaign_owner(campaign_id, (select auth.uid()))
);

drop policy if exists "Owners can update memberships" on public.campaign_memberships;
create policy "Owners can update memberships"
on public.campaign_memberships
for update
using (public.is_campaign_owner(campaign_id, (select auth.uid())))
with check (public.is_campaign_owner(campaign_id, (select auth.uid())));

drop policy if exists "Owners or members can delete memberships" on public.campaign_memberships;
create policy "Owners or members can delete memberships"
on public.campaign_memberships
for delete
using (
  (select auth.uid()) = user_id
  or public.is_campaign_owner(campaign_id, (select auth.uid()))
);

drop policy if exists "Users can read visible characters" on public.characters;
create policy "Users can read visible characters"
on public.characters
for select
using (
  owner_user_id = (select auth.uid())
  or (
    campaign_id is not null
    and public.can_view_campaign(campaign_id, (select auth.uid()))
  )
);

drop policy if exists "Users can create own characters" on public.characters;
create policy "Users can create own characters"
on public.characters
for insert
with check ((select auth.uid()) = owner_user_id);

drop policy if exists "Users can update own characters" on public.characters;
drop policy if exists "Admins can update public characters" on public.characters;
create policy "Owners or admins can update characters"
on public.characters
for update
using (
  (select auth.uid()) = owner_user_id
  or (
    public.is_admin((select auth.uid()))
    and is_private = false
  )
)
with check (
  (select auth.uid()) = owner_user_id
  or (
    public.is_admin((select auth.uid()))
    and is_private = false
  )
);

drop policy if exists "Users can delete own characters" on public.characters;
drop policy if exists "Admins can delete public characters" on public.characters;
create policy "Owners or admins can delete characters"
on public.characters
for delete
using (
  (select auth.uid()) = owner_user_id
  or (
    public.is_admin((select auth.uid()))
    and is_private = false
  )
);

drop policy if exists "Authenticated users can read relationship categories" on public.relationship_categories;
create policy "Authenticated users can read relationship categories"
on public.relationship_categories
for select
using ((select auth.uid()) is not null);

drop policy if exists "Authenticated users can read relationship label presets" on public.relationship_label_presets;
create policy "Authenticated users can read relationship label presets"
on public.relationship_label_presets
for select
using ((select auth.uid()) is not null);

drop policy if exists "Users can read visible relationships" on public.character_relationships;
create policy "Users can read visible relationships"
on public.character_relationships
for select
using (
  public.can_view_character(source_character_id, (select auth.uid()))
  or (
    target_character_id is not null
    and public.can_view_character(target_character_id, (select auth.uid()))
  )
);

drop policy if exists "Users can create relationships from own source" on public.character_relationships;
create policy "Users can create relationships from own source"
on public.character_relationships
for insert
with check ((select auth.uid()) = owner_user_id);

drop policy if exists "Users can update own relationships" on public.character_relationships;
create policy "Users can update own relationships"
on public.character_relationships
for update
using ((select auth.uid()) = owner_user_id)
with check ((select auth.uid()) = owner_user_id);

drop policy if exists "Users can delete own relationships" on public.character_relationships;
create policy "Users can delete own relationships"
on public.character_relationships
for delete
using ((select auth.uid()) = owner_user_id);

drop policy if exists "Users can read visible relationship timeline" on public.relationship_timeline_entries;
create policy "Users can read visible relationship timeline"
on public.relationship_timeline_entries
for select
using (
  exists(
    select 1
    from public.character_relationships r
    where r.id = relationship_id
      and (
        public.can_view_character(r.source_character_id, (select auth.uid()))
        or (
          r.target_character_id is not null
          and public.can_view_character(r.target_character_id, (select auth.uid()))
        )
      )
  )
);

drop policy if exists "Users can create timeline on own relationships" on public.relationship_timeline_entries;
create policy "Users can create timeline on own relationships"
on public.relationship_timeline_entries
for insert
with check ((select auth.uid()) = owner_user_id);

drop policy if exists "Users can delete own timeline entries" on public.relationship_timeline_entries;
create policy "Users can delete own timeline entries"
on public.relationship_timeline_entries
for delete
using ((select auth.uid()) = owner_user_id);

drop policy if exists "Users can read own notifications" on public.notifications;
create policy "Users can read own notifications"
on public.notifications
for select
using ((select auth.uid()) = recipient_user_id);

drop policy if exists "Users can update own notifications" on public.notifications;
create policy "Users can update own notifications"
on public.notifications
for update
using ((select auth.uid()) = recipient_user_id)
with check ((select auth.uid()) = recipient_user_id);

drop policy if exists "Users can delete own notifications" on public.notifications;
create policy "Users can delete own notifications"
on public.notifications
for delete
using ((select auth.uid()) = recipient_user_id);
