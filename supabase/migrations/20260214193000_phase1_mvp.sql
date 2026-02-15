-- Phase 1 MVP schema, RLS, and RPC functions

create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- Remove bootstrap table from starter template.
drop table if exists public.todos cascade;

-- Enums
create type public.app_role as enum ('user', 'admin');
create type public.character_type as enum ('player', 'npc');
create type public.membership_state as enum ('pending', 'accepted', 'rejected');
create type public.membership_source as enum ('invite', 'request');
create type public.notification_event_type as enum (
  'relationship_created',
  'relationship_updated'
);

-- Shared helper functions
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.current_uid()
returns uuid
language sql
stable
as $$
  select auth.uid();
$$;

create or replace function public.text_to_uuid(p_text text)
returns uuid
language plpgsql
immutable
as $$
declare
  parsed uuid;
begin
  begin
    parsed := p_text::uuid;
  exception
    when others then
      parsed := null;
  end;

  return parsed;
end;
$$;

create or replace function public.path_part(p_name text, p_idx int)
returns text
language sql
immutable
as $$
  select (storage.foldername(p_name))[p_idx];
$$;

-- Core tables
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username citext not null unique,
  description text not null default '',
  avatar_path text,
  role public.app_role not null default 'user',
  locale text not null default 'en' check (locale in ('en', 'de')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint username_len check (char_length(username::text) between 3 and 32)
);

create unique index if not exists idx_profiles_single_admin
on public.profiles (role)
where role = 'admin';

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_campaigns_owner on public.campaigns(owner_user_id);

create table if not exists public.campaign_memberships (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  state public.membership_state not null default 'pending',
  source public.membership_source not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  responded_at timestamptz,
  unique (campaign_id, user_id)
);

create index if not exists idx_campaign_memberships_user on public.campaign_memberships(user_id);
create index if not exists idx_campaign_memberships_campaign on public.campaign_memberships(campaign_id);

create table if not exists public.characters (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete set null,
  type public.character_type not null,
  name text not null check (char_length(name) between 1 and 120),
  age int check (age is null or (age >= 0 and age <= 5000)),
  description text not null default '',
  avatar_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_characters_owner on public.characters(owner_user_id);
create index if not exists idx_characters_campaign on public.characters(campaign_id);

create unique index if not exists idx_characters_one_player_per_campaign
on public.characters(campaign_id, owner_user_id)
where campaign_id is not null and type = 'player';

create table if not exists public.relationship_categories (
  id smallserial primary key,
  key text not null unique,
  sort_order int not null default 0
);

create table if not exists public.relationship_label_presets (
  id smallserial primary key,
  key text not null unique,
  sort_order int not null default 0
);

create table if not exists public.character_relationships (
  id uuid primary key default gen_random_uuid(),
  source_character_id uuid not null references public.characters(id) on delete cascade,
  target_character_id uuid references public.characters(id) on delete set null,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  category_id smallint not null references public.relationship_categories(id),
  label_preset_id smallint references public.relationship_label_presets(id),
  label_custom text,
  description text not null default '',
  target_snapshot_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rel_no_self check (target_character_id is null or source_character_id <> target_character_id),
  constraint rel_label_choice check ((label_preset_id is not null) <> (label_custom is not null)),
  constraint rel_target_present check (target_character_id is not null or target_snapshot_name is not null)
);

create unique index if not exists idx_character_relationships_unique_pair
on public.character_relationships(source_character_id, target_character_id)
where target_character_id is not null;

create index if not exists idx_character_relationships_owner on public.character_relationships(owner_user_id);
create index if not exists idx_character_relationships_target on public.character_relationships(target_character_id);

create table if not exists public.relationship_timeline_entries (
  id uuid primary key default gen_random_uuid(),
  relationship_id uuid not null references public.character_relationships(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  occurred_at timestamptz not null default now(),
  content text not null check (char_length(content) between 1 and 5000),
  created_at timestamptz not null default now()
);

create index if not exists idx_relationship_timeline_relationship on public.relationship_timeline_entries(relationship_id);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_user_id uuid not null references auth.users(id) on delete cascade,
  event_type public.notification_event_type not null,
  source_character_id uuid references public.characters(id) on delete set null,
  target_character_id uuid references public.characters(id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists idx_notifications_recipient_created
on public.notifications(recipient_user_id, created_at desc);

-- Updated-at triggers
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger trg_campaigns_updated_at
before update on public.campaigns
for each row execute function public.set_updated_at();

create trigger trg_campaign_memberships_updated_at
before update on public.campaign_memberships
for each row execute function public.set_updated_at();

create trigger trg_characters_updated_at
before update on public.characters
for each row execute function public.set_updated_at();

create trigger trg_character_relationships_updated_at
before update on public.character_relationships
for each row execute function public.set_updated_at();

-- Auth/profile bootstrapping
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  generated_username text;
begin
  generated_username := coalesce(nullif(trim(new.raw_user_meta_data ->> 'username'), ''), 'user_' || left(new.id::text, 8));

  insert into public.profiles (id, username)
  values (new.id, generated_username)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

-- Authorization helpers
create or replace function public.is_admin(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1
    from public.profiles p
    where p.id = p_user_id and p.role = 'admin'
  );
$$;

create or replace function public.is_campaign_owner(p_campaign_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1
    from public.campaigns c
    where c.id = p_campaign_id and c.owner_user_id = p_user_id
  );
$$;

create or replace function public.is_campaign_member(p_campaign_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1
    from public.campaign_memberships m
    where m.campaign_id = p_campaign_id
      and m.user_id = p_user_id
      and m.state = 'accepted'
  );
$$;

create or replace function public.can_view_campaign(p_campaign_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_campaign_owner(p_campaign_id, p_user_id)
     or public.is_campaign_member(p_campaign_id, p_user_id);
$$;

create or replace function public.character_owner(p_character_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select c.owner_user_id
  from public.characters c
  where c.id = p_character_id;
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
          c.campaign_id is not null
          and public.can_view_campaign(c.campaign_id, p_user_id)
        )
      )
  );
$$;

-- Domain validation triggers
create or replace function public.validate_character_campaign_assignment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  campaign_owner uuid;
begin
  if new.campaign_id is null then
    if new.type = 'npc' then
      raise exception 'NPC characters must belong to a campaign';
    end if;

    return new;
  end if;

  select c.owner_user_id
    into campaign_owner
  from public.campaigns c
  where c.id = new.campaign_id;

  if campaign_owner is null then
    raise exception 'Campaign does not exist';
  end if;

  if new.type = 'npc' then
    if new.owner_user_id <> campaign_owner then
      raise exception 'NPC owner must be campaign owner';
    end if;
  else
    if new.owner_user_id <> campaign_owner
      and not public.is_campaign_member(new.campaign_id, new.owner_user_id) then
      raise exception 'Player character owner must be accepted campaign member';
    end if;
  end if;

  return new;
end;
$$;

create trigger trg_validate_character_campaign_assignment
before insert or update on public.characters
for each row execute function public.validate_character_campaign_assignment();

create or replace function public.validate_relationship_ownership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  src_owner uuid;
begin
  select c.owner_user_id
    into src_owner
  from public.characters c
  where c.id = new.source_character_id;

  if src_owner is null then
    raise exception 'Source character does not exist';
  end if;

  if src_owner <> new.owner_user_id then
    raise exception 'Relationship owner must be the source character owner';
  end if;

  if new.target_character_id is not null
    and not public.can_view_character(new.target_character_id, new.owner_user_id) then
    raise exception 'Target character is not visible to relationship owner';
  end if;

  return new;
end;
$$;

create trigger trg_validate_relationship_ownership
before insert or update on public.character_relationships
for each row execute function public.validate_relationship_ownership();

create or replace function public.validate_timeline_ownership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  rel_owner uuid;
begin
  select r.owner_user_id
    into rel_owner
  from public.character_relationships r
  where r.id = new.relationship_id;

  if rel_owner is null then
    raise exception 'Relationship does not exist';
  end if;

  if rel_owner <> new.owner_user_id then
    raise exception 'Timeline entry owner must match relationship owner';
  end if;

  return new;
end;
$$;

create trigger trg_validate_timeline_ownership
before insert or update on public.relationship_timeline_entries
for each row execute function public.validate_timeline_ownership();

create or replace function public.before_campaign_delete_cleanup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Remove campaign NPCs first.
  delete from public.characters c
  where c.campaign_id = old.id and c.type = 'npc';

  -- Unassign player characters.
  update public.characters c
  set campaign_id = null,
      updated_at = now()
  where c.campaign_id = old.id and c.type = 'player';

  return old;
end;
$$;

create trigger trg_before_campaign_delete_cleanup
before delete on public.campaigns
for each row execute function public.before_campaign_delete_cleanup();

-- Notifications helper
create or replace function public.create_relationship_notification(
  p_relationship_id uuid,
  p_event_type public.notification_event_type
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  rel record;
  target_owner uuid;
begin
  select r.id,
         r.owner_user_id,
         r.source_character_id,
         r.target_character_id,
         src.name as source_name,
         tgt.name as target_name
    into rel
  from public.character_relationships r
  join public.characters src on src.id = r.source_character_id
  left join public.characters tgt on tgt.id = r.target_character_id
  where r.id = p_relationship_id;

  if rel.id is null or rel.target_character_id is null then
    return;
  end if;

  target_owner := public.character_owner(rel.target_character_id);

  if target_owner is null or target_owner = rel.owner_user_id then
    return;
  end if;

  insert into public.notifications (
    recipient_user_id,
    event_type,
    source_character_id,
    target_character_id,
    payload
  )
  values (
    target_owner,
    p_event_type,
    rel.source_character_id,
    rel.target_character_id,
    jsonb_build_object(
      'relationship_id', rel.id,
      'source_character_name', rel.source_name,
      'target_character_name', rel.target_name
    )
  );
end;
$$;

-- RPCs
create or replace function public.rpc_create_campaign_with_owner_membership(
  p_title text,
  p_description text default ''
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_campaign_id uuid;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.campaigns (owner_user_id, title, description)
  values (v_uid, p_title, coalesce(p_description, ''))
  returning id into v_campaign_id;

  return v_campaign_id;
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
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_campaign_owner(p_campaign_id, v_uid) then
    raise exception 'Only campaign owner can invite users';
  end if;

  if p_user_id = v_uid then
    raise exception 'Owner cannot invite self';
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

  return v_membership_id;
end;
$$;

create or replace function public.rpc_request_join_campaign(
  p_campaign_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_membership_id uuid;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if public.is_campaign_owner(p_campaign_id, v_uid) then
    raise exception 'Campaign owner cannot request to join own campaign';
  end if;

  insert into public.campaign_memberships (campaign_id, user_id, state, source)
  values (p_campaign_id, v_uid, 'pending', 'request')
  on conflict (campaign_id, user_id)
  do update set
    state = 'pending',
    source = 'request',
    responded_at = null,
    updated_at = now()
  returning id into v_membership_id;

  return v_membership_id;
end;
$$;

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

  if not public.is_campaign_owner(v_campaign_id, v_uid) then
    raise exception 'Only campaign owner can decide membership';
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
    and c.owner_user_id = v_uid;

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

  select c.type into v_type
  from public.characters c
  where c.id = p_character_id
    and c.owner_user_id = v_uid;

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
  v_relationship_id uuid;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.character_relationships (
    source_character_id,
    target_character_id,
    owner_user_id,
    category_id,
    label_preset_id,
    label_custom,
    description
  )
  values (
    p_source_character_id,
    p_target_character_id,
    v_uid,
    p_category_id,
    p_label_preset_id,
    nullif(trim(p_label_custom), ''),
    coalesce(p_description, '')
  )
  returning id into v_relationship_id;

  perform public.create_relationship_notification(v_relationship_id, 'relationship_created');

  return v_relationship_id;
end;
$$;

create or replace function public.rpc_update_relationship(
  p_relationship_id uuid,
  p_target_character_id uuid,
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
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  update public.character_relationships r
  set target_character_id = p_target_character_id,
      target_snapshot_name = case when p_target_character_id is null then r.target_snapshot_name else null end,
      category_id = p_category_id,
      label_preset_id = p_label_preset_id,
      label_custom = nullif(trim(p_label_custom), ''),
      description = coalesce(p_description, ''),
      updated_at = now()
  where r.id = p_relationship_id
    and r.owner_user_id = v_uid;

  if not found then
    raise exception 'Relationship not found or not owned by user';
  end if;

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
  v_entry_id uuid;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.relationship_timeline_entries (
    relationship_id,
    owner_user_id,
    occurred_at,
    content
  )
  values (
    p_relationship_id,
    v_uid,
    coalesce(p_occurred_at, now()),
    p_content
  )
  returning id into v_entry_id;

  return v_entry_id;
end;
$$;

create or replace function public.rpc_mark_notification_read(
  p_notification_id uuid
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

  update public.notifications n
  set is_read = true,
      read_at = now()
  where n.id = p_notification_id
    and n.recipient_user_id = v_uid;

  if not found then
    raise exception 'Notification not found';
  end if;
end;
$$;

create or replace function public.rpc_delete_user_phase1(
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if v_uid <> p_user_id and not public.is_admin(v_uid) then
    raise exception 'Not allowed to delete this user';
  end if;

  -- Preserve incoming relationships by replacing target FK with a snapshot name.
  update public.character_relationships r
  set target_snapshot_name = coalesce(r.target_snapshot_name, c.name),
      target_character_id = null,
      updated_at = now()
  from public.characters c
  where c.owner_user_id = p_user_id
    and r.target_character_id = c.id
    and r.owner_user_id <> p_user_id;

  delete from auth.users u
  where u.id = p_user_id;
end;
$$;

create or replace function public.rpc_admin_delete_user(
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not public.is_admin(auth.uid()) then
    raise exception 'Admin required';
  end if;

  perform public.rpc_delete_user_phase1(p_user_id);
end;
$$;

create or replace function public.rpc_get_character_relations_summary(
  p_character_id uuid
)
returns table (
  other_character_id uuid,
  other_character_name text,
  other_character_deleted boolean
)
language sql
stable
security definer
set search_path = public
as $$
  with outgoing as (
    select
      r.target_character_id as other_character_id,
      coalesce(t.name, r.target_snapshot_name) as other_character_name,
      (r.target_character_id is null) as other_character_deleted
    from public.character_relationships r
    left join public.characters t on t.id = r.target_character_id
    where r.source_character_id = p_character_id
  ),
  incoming as (
    select
      r.source_character_id as other_character_id,
      s.name as other_character_name,
      false as other_character_deleted
    from public.character_relationships r
    join public.characters s on s.id = r.source_character_id
    where r.target_character_id = p_character_id
  ),
  merged as (
    select * from outgoing
    union all
    select * from incoming
  )
  select
    m.other_character_id,
    max(m.other_character_name) as other_character_name,
    bool_or(m.other_character_deleted) as other_character_deleted
  from merged m
  group by m.other_character_id;
$$;

create or replace function public.rpc_get_character_relation_detail(
  p_character_id uuid,
  p_other_character_id uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  result := jsonb_build_object(
    'outgoing', (
      select to_jsonb(r)
      from public.character_relationships r
      where r.source_character_id = p_character_id
        and r.target_character_id = p_other_character_id
    ),
    'incoming', (
      select to_jsonb(r)
      from public.character_relationships r
      where r.source_character_id = p_other_character_id
        and r.target_character_id = p_character_id
    ),
    'timeline', (
      select coalesce(jsonb_agg(to_jsonb(t) order by t.occurred_at desc), '[]'::jsonb)
      from public.relationship_timeline_entries t
      join public.character_relationships r on r.id = t.relationship_id
      where r.source_character_id = p_character_id
        and r.target_character_id = p_other_character_id
    )
  );

  return result;
end;
$$;

-- Seed relationship categories and labels as i18n keys.
insert into public.relationship_categories (key, sort_order)
values
  ('relationship.category.family', 10),
  ('relationship.category.friends', 20),
  ('relationship.category.romance', 30),
  ('relationship.category.conflict', 40),
  ('relationship.category.professional', 50),
  ('relationship.category.other', 60)
on conflict (key) do nothing;

insert into public.relationship_label_presets (key, sort_order)
values
  ('relationship.label.best_friend', 10),
  ('relationship.label.friend', 20),
  ('relationship.label.rival', 30),
  ('relationship.label.enemy', 40),
  ('relationship.label.ally', 50),
  ('relationship.label.mentor', 60),
  ('relationship.label.student', 70),
  ('relationship.label.family', 80),
  ('relationship.label.partner', 90)
on conflict (key) do nothing;

-- Storage buckets (private)
insert into storage.buckets (id, name, public)
values
  ('profile-images', 'profile-images', false),
  ('character-images', 'character-images', false)
on conflict (id) do nothing;

-- RLS
alter table public.profiles enable row level security;
alter table public.campaigns enable row level security;
alter table public.campaign_memberships enable row level security;
alter table public.characters enable row level security;
alter table public.relationship_categories enable row level security;
alter table public.relationship_label_presets enable row level security;
alter table public.character_relationships enable row level security;
alter table public.relationship_timeline_entries enable row level security;
alter table public.notifications enable row level security;

-- Profiles: public to authenticated users; self editable.
create policy "Authenticated users can read profiles"
on public.profiles
for select
using (auth.uid() is not null);

create policy "Users can insert own profile"
on public.profiles
for insert
with check (auth.uid() = id);

create policy "Users can update own profile"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- Campaigns
create policy "Users can read visible campaigns"
on public.campaigns
for select
using (public.can_view_campaign(id, auth.uid()));

create policy "Users can create own campaigns"
on public.campaigns
for insert
with check (auth.uid() = owner_user_id);

create policy "Owners can update campaigns"
on public.campaigns
for update
using (auth.uid() = owner_user_id)
with check (auth.uid() = owner_user_id);

create policy "Owners can delete campaigns"
on public.campaigns
for delete
using (auth.uid() = owner_user_id);

-- Campaign memberships
create policy "Users can read related memberships"
on public.campaign_memberships
for select
using (
  auth.uid() = user_id
  or public.is_campaign_owner(campaign_id, auth.uid())
);

create policy "Users can create own requests or owner invites"
on public.campaign_memberships
for insert
with check (
  auth.uid() = user_id
  or public.is_campaign_owner(campaign_id, auth.uid())
);

create policy "Owners can update memberships"
on public.campaign_memberships
for update
using (public.is_campaign_owner(campaign_id, auth.uid()))
with check (public.is_campaign_owner(campaign_id, auth.uid()));

create policy "Owners or members can delete memberships"
on public.campaign_memberships
for delete
using (
  auth.uid() = user_id
  or public.is_campaign_owner(campaign_id, auth.uid())
);

-- Characters
create policy "Users can read visible characters"
on public.characters
for select
using (public.can_view_character(id, auth.uid()));

create policy "Users can create own characters"
on public.characters
for insert
with check (auth.uid() = owner_user_id);

create policy "Users can update own characters"
on public.characters
for update
using (auth.uid() = owner_user_id)
with check (auth.uid() = owner_user_id);

create policy "Users can delete own characters"
on public.characters
for delete
using (auth.uid() = owner_user_id);

-- Catalogs
create policy "Authenticated users can read relationship categories"
on public.relationship_categories
for select
using (auth.uid() is not null);

create policy "Authenticated users can read relationship label presets"
on public.relationship_label_presets
for select
using (auth.uid() is not null);

-- Relationships
create policy "Users can read visible relationships"
on public.character_relationships
for select
using (
  public.can_view_character(source_character_id, auth.uid())
  or (
    target_character_id is not null
    and public.can_view_character(target_character_id, auth.uid())
  )
);

create policy "Users can create relationships from own source"
on public.character_relationships
for insert
with check (auth.uid() = owner_user_id);

create policy "Users can update own relationships"
on public.character_relationships
for update
using (auth.uid() = owner_user_id)
with check (auth.uid() = owner_user_id);

create policy "Users can delete own relationships"
on public.character_relationships
for delete
using (auth.uid() = owner_user_id);

-- Timeline
create policy "Users can read visible relationship timeline"
on public.relationship_timeline_entries
for select
using (
  exists(
    select 1
    from public.character_relationships r
    where r.id = relationship_id
      and (
        public.can_view_character(r.source_character_id, auth.uid())
        or (
          r.target_character_id is not null
          and public.can_view_character(r.target_character_id, auth.uid())
        )
      )
  )
);

create policy "Users can create timeline on own relationships"
on public.relationship_timeline_entries
for insert
with check (auth.uid() = owner_user_id);

create policy "Users can delete own timeline entries"
on public.relationship_timeline_entries
for delete
using (auth.uid() = owner_user_id);

-- Notifications
create policy "Users can read own notifications"
on public.notifications
for select
using (auth.uid() = recipient_user_id);

create policy "Users can update own notifications"
on public.notifications
for update
using (auth.uid() = recipient_user_id)
with check (auth.uid() = recipient_user_id);

create policy "Users can delete own notifications"
on public.notifications
for delete
using (auth.uid() = recipient_user_id);

-- Storage object policies
create policy "Authenticated users can read profile images"
on storage.objects
for select
using (
  bucket_id = 'profile-images'
  and auth.uid() is not null
);

create policy "Users can upload own profile images"
on storage.objects
for insert
with check (
  bucket_id = 'profile-images'
  and public.path_part(name, 1) = auth.uid()::text
);

create policy "Users can update own profile images"
on storage.objects
for update
using (
  bucket_id = 'profile-images'
  and public.path_part(name, 1) = auth.uid()::text
)
with check (
  bucket_id = 'profile-images'
  and public.path_part(name, 1) = auth.uid()::text
);

create policy "Users can delete own profile images"
on storage.objects
for delete
using (
  bucket_id = 'profile-images'
  and public.path_part(name, 1) = auth.uid()::text
);

create policy "Users can read visible character images"
on storage.objects
for select
using (
  bucket_id = 'character-images'
  and auth.uid() is not null
  and exists (
    select 1
    from public.characters c
    where c.id = public.text_to_uuid(public.path_part(name, 2))
      and public.can_view_character(c.id, auth.uid())
  )
);

create policy "Users can upload own character images"
on storage.objects
for insert
with check (
  bucket_id = 'character-images'
  and public.path_part(name, 1) = auth.uid()::text
  and exists (
    select 1
    from public.characters c
    where c.id = public.text_to_uuid(public.path_part(name, 2))
      and c.owner_user_id = auth.uid()
  )
);

create policy "Users can update own character images"
on storage.objects
for update
using (
  bucket_id = 'character-images'
  and public.path_part(name, 1) = auth.uid()::text
)
with check (
  bucket_id = 'character-images'
  and public.path_part(name, 1) = auth.uid()::text
);

create policy "Users can delete own character images"
on storage.objects
for delete
using (
  bucket_id = 'character-images'
  and public.path_part(name, 1) = auth.uid()::text
);

-- RPC execution grants for authenticated clients.
grant execute on function public.rpc_create_campaign_with_owner_membership(text, text) to authenticated;
grant execute on function public.rpc_invite_user_to_campaign(uuid, uuid) to authenticated;
grant execute on function public.rpc_request_join_campaign(uuid) to authenticated;
grant execute on function public.rpc_decide_campaign_membership(uuid, public.membership_state) to authenticated;
grant execute on function public.rpc_assign_character_to_campaign(uuid, uuid) to authenticated;
grant execute on function public.rpc_unassign_character_from_campaign(uuid) to authenticated;
grant execute on function public.rpc_create_relationship(uuid, uuid, smallint, smallint, text, text) to authenticated;
grant execute on function public.rpc_update_relationship(uuid, uuid, smallint, smallint, text, text) to authenticated;
grant execute on function public.rpc_add_relationship_timeline_entry(uuid, timestamptz, text) to authenticated;
grant execute on function public.rpc_mark_notification_read(uuid) to authenticated;
grant execute on function public.rpc_delete_user_phase1(uuid) to authenticated;
grant execute on function public.rpc_admin_delete_user(uuid) to authenticated;
grant execute on function public.rpc_get_character_relations_summary(uuid) to authenticated;
grant execute on function public.rpc_get_character_relation_detail(uuid, uuid) to authenticated;
