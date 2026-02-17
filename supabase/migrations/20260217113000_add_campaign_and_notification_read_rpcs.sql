-- RPC read aggregations for campaign and notification hot paths.

create or replace function public.rpc_list_campaigns_for_user(
  p_scope text default 'all',
  p_role_for_user_id text default null,
  p_limit int default 100
)
returns table (
  id uuid,
  owner_user_id uuid,
  title text,
  description text,
  is_private boolean,
  created_at timestamptz,
  updated_at timestamptz,
  owner_username text,
  owner_role public.app_role,
  player_count int,
  current_user_role text,
  role_for_user text
)
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_scope text := lower(coalesce(p_scope, 'all'));
  v_role_for_user_id uuid := public.text_to_uuid(p_role_for_user_id);
  v_limit int := greatest(1, least(coalesce(p_limit, 100), 500));
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if v_scope not in ('all', 'public', 'member') then
    v_scope := 'all';
  end if;

  return query
  with visible_campaigns as (
    select
      c.id,
      c.owner_user_id,
      c.title,
      c.description,
      c.is_private,
      c.created_at,
      c.updated_at
    from public.campaigns c
    where public.can_view_campaign(c.id, v_uid)
      and (v_scope <> 'public' or c.is_private = false)
    order by c.updated_at desc
    limit v_limit
  ),
  membership_stats as (
    select
      vc.id as campaign_id,
      count(*) filter (
        where m.state = 'accepted'
          and m.user_id <> vc.owner_user_id
      )::int as player_count,
      bool_or(m.state = 'accepted' and m.user_id = v_uid) as current_is_player,
      bool_or(
        v_role_for_user_id is not null
        and m.state = 'accepted'
        and m.user_id = v_role_for_user_id
      ) as target_is_player
    from visible_campaigns vc
    left join public.campaign_memberships m
      on m.campaign_id = vc.id
    group by vc.id
  )
  select
    vc.id,
    vc.owner_user_id,
    vc.title,
    vc.description,
    vc.is_private,
    vc.created_at,
    vc.updated_at,
    p.username::text as owner_username,
    p.role as owner_role,
    coalesce(ms.player_count, 0) as player_count,
    case
      when vc.owner_user_id = v_uid then 'owner'
      when coalesce(ms.current_is_player, false) then 'player'
      else null
    end as current_user_role,
    case
      when v_role_for_user_id is null then null
      when vc.owner_user_id = v_role_for_user_id then 'owner'
      when coalesce(ms.target_is_player, false) then 'player'
      else null
    end as role_for_user
  from visible_campaigns vc
  left join membership_stats ms on ms.campaign_id = vc.id
  left join public.profiles p on p.id = vc.owner_user_id
  where
    v_scope <> 'member'
    or vc.owner_user_id = v_uid
    or coalesce(ms.current_is_player, false)
  order by vc.updated_at desc;
end;
$$;

create or replace function public.rpc_list_notifications_for_user(
  p_limit int default 100,
  p_only_unread boolean default false
)
returns table (
  id uuid,
  recipient_user_id uuid,
  event_type public.notification_event_type,
  source_character_id uuid,
  target_character_id uuid,
  payload jsonb,
  is_read boolean,
  created_at timestamptz,
  read_at timestamptz
)
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_limit int := greatest(1, least(coalesce(p_limit, 100), 500));
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  return query
  select
    n.id,
    n.recipient_user_id,
    n.event_type,
    n.source_character_id,
    n.target_character_id,
    n.payload,
    n.is_read,
    n.created_at,
    n.read_at
  from public.notifications n
  where n.recipient_user_id = v_uid
    and (not coalesce(p_only_unread, false) or n.is_read = false)
  order by n.created_at desc
  limit v_limit;
end;
$$;

create or replace function public.rpc_count_unread_notifications_for_user()
returns int
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  return coalesce((
    select count(*)::int
    from public.notifications n
    where n.recipient_user_id = v_uid
      and n.is_read = false
  ), 0);
end;
$$;

revoke all on function public.rpc_list_campaigns_for_user(text, text, int) from public;
revoke all on function public.rpc_list_notifications_for_user(int, boolean) from public;
revoke all on function public.rpc_count_unread_notifications_for_user() from public;

grant execute on function public.rpc_list_campaigns_for_user(text, text, int) to authenticated;
grant execute on function public.rpc_list_notifications_for_user(int, boolean) to authenticated;
grant execute on function public.rpc_count_unread_notifications_for_user() to authenticated;
