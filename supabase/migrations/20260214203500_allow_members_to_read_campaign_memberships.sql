drop policy if exists "Users can read related memberships"
on public.campaign_memberships;

create policy "Users can read related memberships"
on public.campaign_memberships
for select
using (
  auth.uid() = user_id
  or public.can_view_campaign(campaign_id, auth.uid())
);
