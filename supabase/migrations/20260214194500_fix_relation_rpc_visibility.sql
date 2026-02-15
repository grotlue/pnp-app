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
  with viewer as (
    select auth.uid() as uid
  ),
  authorized as (
    select 1
    from viewer v
    where v.uid is not null
      and public.can_view_character(p_character_id, v.uid)
  ),
  outgoing as (
    select
      r.id as relation_key,
      r.target_character_id as other_character_id,
      coalesce(t.name, r.target_snapshot_name) as other_character_name,
      (r.target_character_id is null) as other_character_deleted
    from public.character_relationships r
    left join public.characters t on t.id = r.target_character_id
    where r.source_character_id = p_character_id
  ),
  incoming as (
    select
      r.source_character_id as relation_key,
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
  where exists (select 1 from authorized)
  group by coalesce(m.other_character_id, m.relation_key), m.other_character_id;
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
  v_uid uuid := auth.uid();
  result jsonb;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if not public.can_view_character(p_character_id, v_uid)
    or not public.can_view_character(p_other_character_id, v_uid) then
    raise exception 'Not allowed';
  end if;

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
