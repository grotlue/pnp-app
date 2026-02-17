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
  v_membership_user_id uuid;
  v_membership_source public.membership_source;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if p_state not in ('accepted', 'rejected') then
    raise exception 'Decision must be accepted or rejected';
  end if;

  select m.campaign_id, m.user_id, m.source
    into v_campaign_id, v_membership_user_id, v_membership_source
  from public.campaign_memberships m
  where m.id = p_membership_id;

  if v_campaign_id is null then
    raise exception 'Membership not found';
  end if;

  select c.is_private
    into v_is_private
  from public.campaigns c
  where c.id = v_campaign_id;

  if not (
    (v_membership_source = 'invite' and v_membership_user_id = v_uid)
    or public.is_campaign_owner(v_campaign_id, v_uid)
    or (
      public.is_admin(v_uid)
      and coalesce(v_is_private, false) = false
    )
  ) then
    raise exception 'Not allowed to decide membership';
  end if;

  update public.campaign_memberships m
  set state = p_state,
      responded_at = now(),
      updated_at = now()
  where m.id = p_membership_id;
end;
$$;
