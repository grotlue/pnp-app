-- Fix characters SELECT policy to use row columns directly.
-- This avoids false negatives during INSERT ... RETURNING where
-- helper functions that re-query the same table may not see the new row.

drop policy if exists "Users can read visible characters" on public.characters;

create policy "Users can read visible characters"
on public.characters
for select
using (
  owner_user_id = auth.uid()
  or (
    campaign_id is not null
    and public.can_view_campaign(campaign_id, auth.uid())
  )
);
