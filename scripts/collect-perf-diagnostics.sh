#!/usr/bin/env bash

set -euo pipefail

BASE_URL=""
ACCESS_TOKEN=""
ITERATIONS=3
WITH_ADMIN=0

usage() {
  cat <<'EOF'
Usage:
  ./scripts/collect-perf-diagnostics.sh \
    --base-url "https://<preview-url>" \
    --access-token "<token>" \
    [--iterations 3] \
    [--with-admin]

Examples:
  ./scripts/collect-perf-diagnostics.sh --base-url "https://my-preview.vercel.app" --access-token "$TOKEN"
  ./scripts/collect-perf-diagnostics.sh --base-url "https://my-preview.vercel.app" --access-token "$TOKEN" --iterations 5 --with-admin
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --base-url)
      BASE_URL="${2:-}"
      shift 2
      ;;
    --access-token)
      ACCESS_TOKEN="${2:-}"
      shift 2
      ;;
    --iterations)
      ITERATIONS="${2:-}"
      shift 2
      ;;
    --with-admin)
      WITH_ADMIN=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if [[ -z "$BASE_URL" || -z "$ACCESS_TOKEN" ]]; then
  usage
  exit 1
fi

if ! [[ "$ITERATIONS" =~ ^[0-9]+$ ]] || [[ "$ITERATIONS" -lt 1 ]]; then
  echo "--iterations must be a positive integer" >&2
  exit 1
fi

BASE_URL="${BASE_URL%/}"

print_result() {
  local endpoint="$1"
  local index="$2"
  local code="$3"
  local time_total="$4"
  local request_id="$5"
  local server_timing="$6"
  local upstream_region="$7"

  printf '%-26s #%s status=%s time_total=%ss request_id=%s region=%s\n' \
    "$endpoint" \
    "$index" \
    "$code" \
    "$time_total" \
    "${request_id:-n/a}" \
    "${upstream_region:-n/a}"

  if [[ -n "$server_timing" ]]; then
    printf '  server_timing: %s\n' "$server_timing"
  fi
}

run_probe() {
  local endpoint="$1"
  local url="${BASE_URL}${endpoint}"

  local i
  for ((i = 1; i <= ITERATIONS; i += 1)); do
    local headers_file
    headers_file="$(mktemp)"

    local curl_output
    curl_output="$(curl -sS -o /dev/null \
      -D "$headers_file" \
      -H "Authorization: Bearer ${ACCESS_TOKEN}" \
      -H "Accept: application/json" \
      -w "%{http_code} %{time_total}" \
      "$url")"

    local code time_total
    code="$(echo "$curl_output" | awk '{print $1}')"
    time_total="$(echo "$curl_output" | awk '{print $2}')"

    local request_id server_timing upstream_region
    request_id="$(grep -i '^x-request-id:' "$headers_file" | tail -n 1 | sed 's/^[^:]*:[[:space:]]*//' | tr -d '\r')"
    server_timing="$(grep -i '^server-timing:' "$headers_file" | tail -n 1 | sed 's/^[^:]*:[[:space:]]*//' | tr -d '\r')"
    upstream_region="$(grep -i '^x-upstream-region:' "$headers_file" | tail -n 1 | sed 's/^[^:]*:[[:space:]]*//' | tr -d '\r')"

    print_result "$endpoint" "$i" "$code" "$time_total" "$request_id" "$server_timing" "$upstream_region"
    rm -f "$headers_file"
  done
}

echo "Base URL: $BASE_URL"
echo "Iterations per endpoint: $ITERATIONS"
echo

run_probe "/api/me"
run_probe "/api/campaigns?scope=member"
run_probe "/api/characters?scope=mine"

if [[ "$WITH_ADMIN" -eq 1 ]]; then
  run_probe "/api/admin/bootstrap"
fi
