#!/usr/bin/env bash

set -euo pipefail

project_id="$(sed -nE 's/^project_id = "([^"]+)"/\1/p' supabase/config.toml | head -n 1)"
if [ -z "$project_id" ]; then
  echo "Could not read project_id from supabase/config.toml." >&2
  exit 1
fi

db_container="supabase_db_${project_id}"
if ! docker ps --format '{{.Names}}' | grep -qx "$db_container"; then
  echo "No running Supabase DB container found for project '${project_id}' (expected: ${db_container})." >&2
  exit 1
fi

sql="$(cat <<'SQL'
with fk as (
  select
    c.conname,
    n.nspname as schema_name,
    cl.relname as table_name,
    c.conrelid,
    c.conkey
  from pg_constraint c
  join pg_class cl on cl.oid = c.conrelid
  join pg_namespace n on n.oid = cl.relnamespace
  where c.contype = 'f'
    and n.nspname = 'public'
),
covering_indexes as (
  select
    i.indrelid,
    i.indkey,
    i.indnatts,
    i.indisvalid,
    i.indisready
  from pg_index i
)
select format('%I.%I (%s)', fk.schema_name, fk.table_name, fk.conname)
from fk
where not exists (
  select 1
  from covering_indexes i
  where i.indrelid = fk.conrelid
    and i.indisvalid
    and i.indisready
    and i.indnatts >= cardinality(fk.conkey)
    and i.indkey[0:cardinality(fk.conkey)-1]::smallint[] = fk.conkey
)
order by 1;
SQL
)"

issues="$(
  docker exec "$db_container" psql -U postgres -d postgres -Atc "$sql"
)"

if [ -n "$issues" ]; then
  echo "Found unindexed foreign keys in public schema:"
  echo "$issues"
  exit 1
fi

echo "All foreign keys in public schema have covering indexes."
