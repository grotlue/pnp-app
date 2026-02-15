#!/usr/bin/env bash
set -euo pipefail

if ! command -v supabase >/dev/null 2>&1; then
  echo "supabase CLI not found in PATH. Run npm install first." >&2
  exit 1
fi

status_env="$(supabase status -o env)"
api_url="$(printf '%s\n' "$status_env" | sed -n 's/^API_URL=//p')"
anon_key="$(printf '%s\n' "$status_env" | sed -n 's/^ANON_KEY=//p')"
service_role_key="$(printf '%s\n' "$status_env" | sed -n 's/^SERVICE_ROLE_KEY=//p')"

if [ -z "$api_url" ] || [ -z "$anon_key" ] || [ -z "$service_role_key" ]; then
  echo "Could not read API_URL/ANON_KEY/SERVICE_ROLE_KEY from 'supabase status -o env'." >&2
  echo "Make sure local Supabase is running: npm run supabase:start" >&2
  exit 1
fi

cat > .env.local <<EOF_ENV
NEXT_PUBLIC_SUPABASE_URL=$api_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=$anon_key
SUPABASE_SERVICE_ROLE_KEY=$service_role_key
EOF_ENV

echo "Updated .env.local from local Supabase status."
