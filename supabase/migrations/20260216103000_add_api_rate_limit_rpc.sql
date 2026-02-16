create table if not exists public.api_rate_limits (
  key text not null,
  window_start timestamptz not null,
  request_count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (key, window_start)
);

create index if not exists idx_api_rate_limits_updated_at
on public.api_rate_limits (updated_at);

create or replace function public.rpc_check_rate_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_window_seconds integer := greatest(1, p_window_seconds);
  v_window_start timestamptz;
  v_count integer;
  v_elapsed integer;
  v_retry_after integer;
begin
  if p_key is null or length(trim(p_key)) = 0 then
    raise exception 'rate limit key is required';
  end if;

  if p_limit <= 0 then
    raise exception 'rate limit must be greater than zero';
  end if;

  v_window_start := to_timestamp(
    floor(extract(epoch from v_now) / v_window_seconds) * v_window_seconds
  );

  insert into public.api_rate_limits (key, window_start, request_count, updated_at)
  values (p_key, v_window_start, 1, v_now)
  on conflict (key, window_start)
  do update set
    request_count = public.api_rate_limits.request_count + 1,
    updated_at = excluded.updated_at
  returning request_count into v_count;

  v_elapsed := greatest(0, floor(extract(epoch from (v_now - v_window_start)))::integer);
  v_retry_after := greatest(1, v_window_seconds - v_elapsed);

  delete from public.api_rate_limits
  where updated_at < (v_now - interval '1 day');

  return jsonb_build_object(
    'allowed', v_count <= p_limit,
    'remaining', greatest(p_limit - v_count, 0),
    'retry_after_seconds', v_retry_after
  );
end;
$$;

revoke all on function public.rpc_check_rate_limit(text, integer, integer) from public;
grant execute on function public.rpc_check_rate_limit(text, integer, integer) to service_role;
