-- Local development fixture data.
-- This file is only used by local Supabase reset (`yarn supabase:db:reset`).

with fixture_users as (
  select *
  from (
    values
      ('00000000-0000-0000-0000-0000000000a1'::uuid, 'admin@pnp.test', 'admin', 'Local admin account', 'admin'::public.app_role),
      ('00000000-0000-0000-0000-0000000000a2'::uuid, 'owner.local@pnp.test', 'owner_local', 'Campaign owner account', 'user'::public.app_role),
      ('00000000-0000-0000-0000-0000000000a3'::uuid, 'player1.local@pnp.test', 'player_one', 'Campaign player #1', 'user'::public.app_role),
      ('00000000-0000-0000-0000-0000000000a4'::uuid, 'player2.local@pnp.test', 'player_two', 'Campaign player #2', 'user'::public.app_role),
      ('00000000-0000-0000-0000-0000000000a5'::uuid, 'player3.local@pnp.test', 'player_three', 'Campaign player #3', 'user'::public.app_role),
      ('00000000-0000-0000-0000-0000000000a6'::uuid, 'player4.local@pnp.test', 'player_four', 'Campaign player #4', 'user'::public.app_role),
      ('00000000-0000-0000-0000-0000000000a7'::uuid, 'member-unassigned.local@pnp.test', 'member_no_assignment', 'Campaign member without assigned character', 'user'::public.app_role),
      ('00000000-0000-0000-0000-0000000000a8'::uuid, 'solo1.local@pnp.test', 'solo_one', 'Standalone player #1', 'user'::public.app_role),
      ('00000000-0000-0000-0000-0000000000a9'::uuid, 'solo2.local@pnp.test', 'solo_two', 'Standalone player #2', 'user'::public.app_role)
  ) as t(id, email, username, description, role)
)
insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  invited_at,
  confirmation_token,
  confirmation_sent_at,
  recovery_token,
  recovery_sent_at,
  email_change_token_new,
  email_change,
  email_change_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  phone,
  phone_confirmed_at,
  phone_change,
  phone_change_token,
  phone_change_sent_at,
  email_change_token_current,
  email_change_confirm_status,
  banned_until,
  reauthentication_token,
  reauthentication_sent_at,
  is_sso_user,
  deleted_at,
  is_anonymous
)
select
  '00000000-0000-0000-0000-000000000000'::uuid,
  u.id,
  'authenticated',
  'authenticated',
  u.email,
  crypt(
    case
      when u.role = 'admin' then 'admin'
      else 'DevPass123!'
    end,
    gen_salt('bf')
  ),
  now(),
  null,
  '',
  null,
  '',
  null,
  '',
  '',
  null,
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('username', u.username),
  false,
  now(),
  now(),
  null,
  null,
  '',
  '',
  null,
  '',
  0,
  null,
  '',
  null,
  false,
  null,
  false
from fixture_users u;

with fixture_users as (
  select *
  from (
    values
      ('00000000-0000-0000-0000-0000000000a1'::uuid, 'admin@pnp.test', 'admin', 'Local admin account', 'admin'::public.app_role),
      ('00000000-0000-0000-0000-0000000000a2'::uuid, 'owner.local@pnp.test', 'owner_local', 'Campaign owner account', 'user'::public.app_role),
      ('00000000-0000-0000-0000-0000000000a3'::uuid, 'player1.local@pnp.test', 'player_one', 'Campaign player #1', 'user'::public.app_role),
      ('00000000-0000-0000-0000-0000000000a4'::uuid, 'player2.local@pnp.test', 'player_two', 'Campaign player #2', 'user'::public.app_role),
      ('00000000-0000-0000-0000-0000000000a5'::uuid, 'player3.local@pnp.test', 'player_three', 'Campaign player #3', 'user'::public.app_role),
      ('00000000-0000-0000-0000-0000000000a6'::uuid, 'player4.local@pnp.test', 'player_four', 'Campaign player #4', 'user'::public.app_role),
      ('00000000-0000-0000-0000-0000000000a7'::uuid, 'member-unassigned.local@pnp.test', 'member_no_assignment', 'Campaign member without assigned character', 'user'::public.app_role),
      ('00000000-0000-0000-0000-0000000000a8'::uuid, 'solo1.local@pnp.test', 'solo_one', 'Standalone player #1', 'user'::public.app_role),
      ('00000000-0000-0000-0000-0000000000a9'::uuid, 'solo2.local@pnp.test', 'solo_two', 'Standalone player #2', 'user'::public.app_role)
  ) as t(id, email, username, description, role)
)
insert into auth.identities (
  provider_id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
select
  lower(u.email),
  u.id,
  jsonb_build_object('sub', u.id::text, 'email', lower(u.email)),
  'email',
  now(),
  now(),
  now()
from fixture_users u;

with fixture_users as (
  select *
  from (
    values
      ('00000000-0000-0000-0000-0000000000a1'::uuid, 'admin@pnp.test', 'admin', 'Local admin account', 'admin'::public.app_role),
      ('00000000-0000-0000-0000-0000000000a2'::uuid, 'owner.local@pnp.test', 'owner_local', 'Campaign owner account', 'user'::public.app_role),
      ('00000000-0000-0000-0000-0000000000a3'::uuid, 'player1.local@pnp.test', 'player_one', 'Campaign player #1', 'user'::public.app_role),
      ('00000000-0000-0000-0000-0000000000a4'::uuid, 'player2.local@pnp.test', 'player_two', 'Campaign player #2', 'user'::public.app_role),
      ('00000000-0000-0000-0000-0000000000a5'::uuid, 'player3.local@pnp.test', 'player_three', 'Campaign player #3', 'user'::public.app_role),
      ('00000000-0000-0000-0000-0000000000a6'::uuid, 'player4.local@pnp.test', 'player_four', 'Campaign player #4', 'user'::public.app_role),
      ('00000000-0000-0000-0000-0000000000a7'::uuid, 'member-unassigned.local@pnp.test', 'member_no_assignment', 'Campaign member without assigned character', 'user'::public.app_role),
      ('00000000-0000-0000-0000-0000000000a8'::uuid, 'solo1.local@pnp.test', 'solo_one', 'Standalone player #1', 'user'::public.app_role),
      ('00000000-0000-0000-0000-0000000000a9'::uuid, 'solo2.local@pnp.test', 'solo_two', 'Standalone player #2', 'user'::public.app_role)
  ) as t(id, email, username, description, role)
)
update public.profiles p
set
  username = u.username::citext,
  description = u.description,
  role = u.role,
  locale = 'de',
  updated_at = now()
from fixture_users u
where p.id = u.id;

update public.profiles
set locale = 'en', updated_at = now()
where id = '00000000-0000-0000-0000-0000000000a8'::uuid;

insert into public.campaigns (
  id,
  owner_user_id,
  title,
  description
)
values (
  '10000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-0000000000a2'::uuid,
  'Schatten ueber Talheim',
  'Lokales Fixture: Kampagne mit Owner, Mitgliedern und NPCs'
);

insert into public.campaign_memberships (
  campaign_id,
  user_id,
  state,
  source,
  responded_at
)
values
  ('10000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-0000000000a3'::uuid, 'accepted', 'invite', now()),
  ('10000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-0000000000a4'::uuid, 'accepted', 'invite', now()),
  ('10000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-0000000000a5'::uuid, 'accepted', 'invite', now()),
  ('10000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-0000000000a6'::uuid, 'accepted', 'invite', now()),
  ('10000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-0000000000a7'::uuid, 'accepted', 'invite', now());

insert into public.characters (
  id,
  owner_user_id,
  campaign_id,
  type,
  name,
  age,
  description
)
values
  -- 5 NPCs owned by campaign owner and assigned to campaign
  ('20000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-0000000000a2'::uuid, '10000000-0000-0000-0000-000000000001'::uuid, 'npc', 'Hauptmann Rurik', 47, 'Wache von Talheim'),
  ('20000000-0000-0000-0000-000000000002'::uuid, '00000000-0000-0000-0000-0000000000a2'::uuid, '10000000-0000-0000-0000-000000000001'::uuid, 'npc', 'Mira die Heilerin', 33, 'Kennt viele Geruechte'),
  ('20000000-0000-0000-0000-000000000003'::uuid, '00000000-0000-0000-0000-0000000000a2'::uuid, '10000000-0000-0000-0000-000000000001'::uuid, 'npc', 'Brann Eisenfaust', 52, 'Schmied im Marktviertel'),
  ('20000000-0000-0000-0000-000000000004'::uuid, '00000000-0000-0000-0000-0000000000a2'::uuid, '10000000-0000-0000-0000-000000000001'::uuid, 'npc', 'Liora Nachtwind', 29, 'Informantin mit vielen Kontakten'),
  ('20000000-0000-0000-0000-000000000005'::uuid, '00000000-0000-0000-0000-0000000000a2'::uuid, '10000000-0000-0000-0000-000000000001'::uuid, 'npc', 'Abt Seren', 61, 'Leitet das alte Kloster'),

  -- 4 players with one assigned character each in campaign
  ('20000000-0000-0000-0000-000000000006'::uuid, '00000000-0000-0000-0000-0000000000a3'::uuid, '10000000-0000-0000-0000-000000000001'::uuid, 'player', 'Aldric Sternklinge', 26, 'Krieger aus dem Norden'),
  ('20000000-0000-0000-0000-000000000007'::uuid, '00000000-0000-0000-0000-0000000000a4'::uuid, '10000000-0000-0000-0000-000000000001'::uuid, 'player', 'Selene Mondpfad', 24, 'Spurenleserin und Bogenexpertin'),
  ('20000000-0000-0000-0000-000000000008'::uuid, '00000000-0000-0000-0000-0000000000a5'::uuid, '10000000-0000-0000-0000-000000000001'::uuid, 'player', 'Corvin Glas', 31, 'Arkaner Gelehrter'),
  ('20000000-0000-0000-0000-000000000009'::uuid, '00000000-0000-0000-0000-0000000000a6'::uuid, '10000000-0000-0000-0000-000000000001'::uuid, 'player', 'Tessa Flinkhand', 22, 'Diebin mit Herz'),

  -- 1 campaign member with character not assigned to campaign
  ('20000000-0000-0000-0000-00000000000a'::uuid, '00000000-0000-0000-0000-0000000000a7'::uuid, null, 'player', 'Nero Schwarzfels', 28, 'Noch nicht in die Kampagne eingebracht'),

  -- 2 users with one standalone character each
  ('20000000-0000-0000-0000-00000000000b'::uuid, '00000000-0000-0000-0000-0000000000a8'::uuid, null, 'player', 'Yara Nebelblick', 27, 'Freie Abenteurerin'),
  ('20000000-0000-0000-0000-00000000000c'::uuid, '00000000-0000-0000-0000-0000000000a9'::uuid, null, 'player', 'Dorian Falk', 35, 'Scharfschuetze auf Reisen');

insert into public.notifications (
  id,
  recipient_user_id,
  event_type,
  source_character_id,
  target_character_id,
  payload,
  is_read,
  created_at
)
values (
  '30000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-0000000000a8'::uuid,
  'relationship_created',
  '20000000-0000-0000-0000-000000000006'::uuid,
  '20000000-0000-0000-0000-00000000000b'::uuid,
  '{"source_character_name":"Aldric Sternklinge","target_character_name":"Yara Nebelblick"}'::jsonb,
  false,
  now()
);
