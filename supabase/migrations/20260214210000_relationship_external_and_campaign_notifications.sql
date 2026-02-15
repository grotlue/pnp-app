-- Extend notification events for campaign workflows.
alter type public.notification_event_type add value if not exists 'campaign_invite';
alter type public.notification_event_type add value if not exists 'campaign_join_request';

-- Replace relationship RPCs to support target snapshots (non-platform characters).
drop function if exists public.rpc_create_relationship(uuid, uuid, smallint, smallint, text, text);
drop function if exists public.rpc_update_relationship(uuid, uuid, smallint, smallint, text, text);

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
    v_uid,
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
  v_snapshot_name text := nullif(trim(coalesce(p_target_snapshot_name, '')), '');
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if (p_target_character_id is null and v_snapshot_name is null)
    or (p_target_character_id is not null and v_snapshot_name is not null) then
    raise exception 'Provide either target character id or snapshot name';
  end if;

  update public.character_relationships r
  set target_character_id = p_target_character_id,
      target_snapshot_name = v_snapshot_name,
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

-- Campaign notification integration.
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

  select c.title into v_campaign_title
  from public.campaigns c
  where c.id = p_campaign_id;

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
  v_owner_id uuid;
  v_campaign_title text;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if public.is_campaign_owner(p_campaign_id, v_uid) then
    raise exception 'Campaign owner cannot request to join own campaign';
  end if;

  select c.owner_user_id, c.title
    into v_owner_id, v_campaign_title
  from public.campaigns c
  where c.id = p_campaign_id;

  insert into public.campaign_memberships (campaign_id, user_id, state, source)
  values (p_campaign_id, v_uid, 'pending', 'request')
  on conflict (campaign_id, user_id)
  do update set
    state = 'pending',
    source = 'request',
    responded_at = null,
    updated_at = now()
  returning id into v_membership_id;

  if v_owner_id is not null and v_owner_id <> v_uid then
    insert into public.notifications (
      recipient_user_id,
      event_type,
      payload
    )
    values (
      v_owner_id,
      'campaign_join_request',
      jsonb_build_object(
        'campaign_id', p_campaign_id,
        'campaign_title', v_campaign_title,
        'requested_by_user_id', v_uid,
        'membership_id', v_membership_id
      )
    );
  end if;

  return v_membership_id;
end;
$$;

grant execute on function public.rpc_create_relationship(uuid, uuid, text, smallint, smallint, text, text) to authenticated;
grant execute on function public.rpc_update_relationship(uuid, uuid, text, smallint, smallint, text, text) to authenticated;
