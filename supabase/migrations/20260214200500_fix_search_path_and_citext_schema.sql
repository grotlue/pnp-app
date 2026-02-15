create schema if not exists extensions;

-- Move citext out of public schema to satisfy security/advisor recommendations.
alter extension citext set schema extensions;

-- Ensure helper functions in public have immutable search_path settings.
alter function public.current_uid() set search_path = pg_catalog;
alter function public.text_to_uuid(text) set search_path = pg_catalog;
alter function public.path_part(text, integer) set search_path = pg_catalog;
