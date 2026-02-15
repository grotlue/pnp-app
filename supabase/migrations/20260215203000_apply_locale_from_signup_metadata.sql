create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  generated_username text;
  generated_locale text;
begin
  generated_username := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'username'), ''),
    'user_' || left(new.id::text, 8)
  );
  generated_locale := case
    when new.raw_user_meta_data ->> 'locale' = 'de' then 'de'
    else 'en'
  end;

  insert into public.profiles (id, username, locale)
  values (new.id, generated_username, generated_locale)
  on conflict (id) do nothing;

  return new;
end;
$$;
