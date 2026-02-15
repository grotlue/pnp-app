-- Privacy controls for campaigns and characters.
-- Public items are visible to authenticated users.
-- Private items are visible to owners only.

alter table public.campaigns
  add column if not exists is_private boolean not null default false;

alter table public.characters
  add column if not exists is_private boolean not null default false;

create index if not exists idx_campaigns_is_private_created
on public.campaigns (is_private, created_at desc);

create index if not exists idx_characters_is_private_created
on public.characters (is_private, created_at desc);

create or replace function public.can_view_campaign(p_campaign_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1
    from public.campaigns c
    where c.id = p_campaign_id
      and (
        c.owner_user_id = p_user_id
        or (
          p_user_id is not null
          and c.is_private = false
        )
      )
  );
$$;

create or replace function public.can_view_character(p_character_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1
    from public.characters c
    where c.id = p_character_id
      and (
        c.owner_user_id = p_user_id
        or (
          p_user_id is not null
          and c.is_private = false
        )
      )
  );
$$;

drop policy if exists "Admins can read campaigns" on public.campaigns;
drop policy if exists "Admins can manage campaigns updates" on public.campaigns;
drop policy if exists "Admins can manage campaigns deletes" on public.campaigns;
drop policy if exists "Admins can read campaign memberships" on public.campaign_memberships;
drop policy if exists "Admins can read characters" on public.characters;
drop policy if exists "Admins can insert characters" on public.characters;
drop policy if exists "Admins can update characters" on public.characters;
drop policy if exists "Admins can delete characters" on public.characters;
drop policy if exists "Admins can read relationships" on public.character_relationships;
drop policy if exists "Admins can insert relationships" on public.character_relationships;
drop policy if exists "Admins can update relationships" on public.character_relationships;
drop policy if exists "Admins can delete relationships" on public.character_relationships;
drop policy if exists "Admins can read relationship timeline" on public.relationship_timeline_entries;
drop policy if exists "Admins can insert relationship timeline" on public.relationship_timeline_entries;
drop policy if exists "Admins can delete relationship timeline" on public.relationship_timeline_entries;

create policy "Admins can update public campaigns"
on public.campaigns
for update
using (public.is_admin(auth.uid()) and is_private = false)
with check (public.is_admin(auth.uid()) and is_private = false);

create policy "Admins can delete public campaigns"
on public.campaigns
for delete
using (public.is_admin(auth.uid()) and is_private = false);

create policy "Admins can update public characters"
on public.characters
for update
using (public.is_admin(auth.uid()) and is_private = false)
with check (public.is_admin(auth.uid()) and is_private = false);

create policy "Admins can delete public characters"
on public.characters
for delete
using (public.is_admin(auth.uid()) and is_private = false);

create or replace function public.rpc_decide_campaign_membership(
  p_membership_id uuid,
  p_state public.membership_state
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_campaign_id uuid;
  v_is_private boolean;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if p_state not in ('accepted', 'rejected') then
    raise exception 'Decision must be accepted or rejected';
  end if;

  select m.campaign_id
    into v_campaign_id
  from public.campaign_memberships m
  where m.id = p_membership_id;

  if v_campaign_id is null then
    raise exception 'Membership not found';
  end if;

  select c.is_private
    into v_is_private
  from public.campaigns c
  where c.id = v_campaign_id;

  if not public.is_campaign_owner(v_campaign_id, v_uid) then
    if not public.is_admin(v_uid) then
      raise exception 'Only campaign owner can decide membership';
    end if;

    if coalesce(v_is_private, false) then
      raise exception 'Private campaigns can only be managed by owner';
    end if;
  end if;

  update public.campaign_memberships m
  set state = p_state,
      responded_at = now(),
      updated_at = now()
  where m.id = p_membership_id;
end;
$$;

create or replace function public.rpc_assign_character_to_campaign(
  p_character_id uuid,
  p_campaign_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  update public.characters c
  set campaign_id = p_campaign_id,
      updated_at = now()
  where c.id = p_character_id
    and (
      c.owner_user_id = v_uid
      or (public.is_admin(v_uid) and c.is_private = false)
    );

  if not found then
    raise exception 'Character not found or not owned by user';
  end if;
end;
$$;

create or replace function public.rpc_unassign_character_from_campaign(
  p_character_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_type public.character_type;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  select c.type
    into v_type
  from public.characters c
  where c.id = p_character_id
    and (
      c.owner_user_id = v_uid
      or (public.is_admin(v_uid) and c.is_private = false)
    );

  if v_type is null then
    raise exception 'Character not found or not owned by user';
  end if;

  if v_type = 'npc' then
    raise exception 'NPC cannot be unassigned from campaign';
  end if;

  update public.characters c
  set campaign_id = null,
      updated_at = now()
  where c.id = p_character_id;
end;
$$;

create or replace function public.rpc_create_relationship(
  p_source_character_id uuid,
  p_target_character_id uuid,
  p_target_snapshot_name text,
  p_category_id smallint,
  p_label_preset_id smallint,
  p_label_custom text,
  p_description text default ''
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_is_admin boolean;
  v_source_owner uuid;
  v_source_is_private boolean;
  v_relationship_id uuid;
  v_snapshot_name text := nullif(trim(coalesce(p_target_snapshot_name, '')), '');
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if (p_target_character_id is null and v_snapshot_name is null)
    or (p_target_character_id is not null and v_snapshot_name is not null) then
    raise exception 'Provide either target character id or snapshot name';
  end if;

  v_is_admin := public.is_admin(v_uid);

  select c.owner_user_id, c.is_private
    into v_source_owner, v_source_is_private
  from public.characters c
  where c.id = p_source_character_id;

  if v_source_owner is null then
    raise exception 'Source character does not exist';
  end if;

  if not v_is_admin and v_source_owner <> v_uid then
    raise exception 'Source character not found or not owned by user';
  end if;

  if v_is_admin and v_source_owner <> v_uid and coalesce(v_source_is_private, false) then
    raise exception 'Private relationships can only be managed by owner';
  end if;

  insert into public.character_relationships (
    source_character_id,
    target_character_id,
    owner_user_id,
    category_id,
    label_preset_id,
    label_custom,
    description,
    target_snapshot_name
  )
  values (
    p_source_character_id,
    p_target_character_id,
    v_source_owner,
    p_category_id,
    p_label_preset_id,
    nullif(trim(p_label_custom), ''),
    coalesce(p_description, ''),
    v_snapshot_name
  )
  returning id into v_relationship_id;

  perform public.create_relationship_notification(v_relationship_id, 'relationship_created');

  return v_relationship_id;
end;
$$;

create or replace function public.rpc_update_relationship(
  p_relationship_id uuid,
  p_target_character_id uuid,
  p_target_snapshot_name text,
  p_category_id smallint,
  p_label_preset_id smallint,
  p_label_custom text,
  p_description text default ''
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_is_admin boolean;
  v_snapshot_name text := nullif(trim(coalesce(p_target_snapshot_name, '')), '');
  v_relationship_owner uuid;
  v_source_is_private boolean;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if (p_target_character_id is null and v_snapshot_name is null)
    or (p_target_character_id is not null and v_snapshot_name is not null) then
    raise exception 'Provide either target character id or snapshot name';
  end if;

  v_is_admin := public.is_admin(v_uid);

  select r.owner_user_id, c.is_private
    into v_relationship_owner, v_source_is_private
  from public.character_relationships r
  join public.characters c on c.id = r.source_character_id
  where r.id = p_relationship_id;

  if v_relationship_owner is null then
    raise exception 'Relationship not found or not owned by user';
  end if;

  if not v_is_admin and v_relationship_owner <> v_uid then
    raise exception 'Relationship not found or not owned by user';
  end if;

  if v_is_admin and v_relationship_owner <> v_uid and coalesce(v_source_is_private, false) then
    raise exception 'Private relationships can only be managed by owner';
  end if;

  update public.character_relationships r
  set target_character_id = p_target_character_id,
      target_snapshot_name = v_snapshot_name,
      category_id = p_category_id,
      label_preset_id = p_label_preset_id,
      label_custom = nullif(trim(p_label_custom), ''),
      description = coalesce(p_description, ''),
      updated_at = now()
  where r.id = p_relationship_id;

  perform public.create_relationship_notification(p_relationship_id, 'relationship_updated');
end;
$$;

create or replace function public.rpc_add_relationship_timeline_entry(
  p_relationship_id uuid,
  p_occurred_at timestamptz,
  p_content text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_is_admin boolean;
  v_owner_user_id uuid;
  v_source_is_private boolean;
  v_entry_id uuid;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  v_is_admin := public.is_admin(v_uid);

  select r.owner_user_id, c.is_private
    into v_owner_user_id, v_source_is_private
  from public.character_relationships r
  join public.characters c on c.id = r.source_character_id
  where r.id = p_relationship_id;

  if v_owner_user_id is null then
    raise exception 'Relationship not found';
  end if;

  if not v_is_admin and v_owner_user_id <> v_uid then
    raise exception 'Relationship not found or not owned by user';
  end if;

  if v_is_admin and v_owner_user_id <> v_uid and coalesce(v_source_is_private, false) then
    raise exception 'Private relationships can only be managed by owner';
  end if;

  insert into public.relationship_timeline_entries (
    relationship_id,
    owner_user_id,
    occurred_at,
    content
  )
  values (
    p_relationship_id,
    v_owner_user_id,
    coalesce(p_occurred_at, now()),
    p_content
  )
  returning id into v_entry_id;

  return v_entry_id;
end;
$$;

create or replace function public.rpc_invite_user_to_campaign(
  p_campaign_id uuid,
  p_user_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_membership_id uuid;
  v_campaign_title text;
  v_is_private boolean;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_campaign_owner(p_campaign_id, v_uid) then
    if not public.is_admin(v_uid) then
      raise exception 'Only campaign owner can invite users';
    end if;
  end if;

  if p_user_id = v_uid then
    raise exception 'Owner cannot invite self';
  end if;

  select c.title, c.is_private
    into v_campaign_title, v_is_private
  from public.campaigns c
  where c.id = p_campaign_id;

  if v_campaign_title is null then
    raise exception 'Campaign not found';
  end if;

  if public.is_admin(v_uid)
    and not public.is_campaign_owner(p_campaign_id, v_uid)
    and coalesce(v_is_private, false) then
    raise exception 'Private campaigns can only be managed by owner';
  end if;

  insert into public.campaign_memberships (campaign_id, user_id, state, source)
  values (p_campaign_id, p_user_id, 'pending', 'invite')
  on conflict (campaign_id, user_id)
  do update set
    state = 'pending',
    source = 'invite',
    responded_at = null,
    updated_at = now()
  returning id into v_membership_id;

  insert into public.notifications (
    recipient_user_id,
    event_type,
    payload
  )
  values (
    p_user_id,
    'campaign_invite',
    jsonb_build_object(
      'campaign_id', p_campaign_id,
      'campaign_title', v_campaign_title,
      'invited_by_user_id', v_uid,
      'membership_id', v_membership_id
    )
  );

  return v_membership_id;
end;
$$;
