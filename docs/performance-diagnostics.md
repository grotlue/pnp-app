# Performance Diagnostics (Preview + Multi-Region)

This guide helps isolate whether slow loading is mostly:

- client-side loading gates
- API/server processing
- network/region latency (Vercel <-> Supabase)

## 1) Enable diagnostics

Set these environment variables for the preview deployment you want to inspect:

- `ENABLE_PERF_DIAGNOSTICS=true`
- `NEXT_PUBLIC_ENABLE_PERF_DIAGNOSTICS=true`

Server diagnostics emit:

- `Server-Timing` header
- `X-Request-Id` header
- optional `X-Upstream-Region` header
- structured `perf_diagnostics` logs

Client diagnostics emit:

- `client_perf_diagnostics` logs (screen-level readiness/loading/loaded timing)
- `api_perf_diagnostics` logs (request duration + response headers)

Vercel Speed Insights:

- enabled by default in `preview` and `production`
- disabled by default in `development`
- optional override: `ENABLE_VERCEL_SPEED_INSIGHTS=false`

## 2) Instrumented API routes

Initial diagnostics coverage focuses on the slowest flows:

- `GET /api/admin/bootstrap`
- `GET /api/me`
- `GET /api/campaigns`
- `GET /api/characters`

## 3) Collect server timing quickly

Use the helper script:

```bash
./scripts/collect-perf-diagnostics.sh \
  --base-url "https://<preview-url>" \
  --access-token "<token>" \
  --iterations 5
```

Optional:

- add `--with-admin` to include `/api/admin/bootstrap`

## 4) Multi-region comparison

Run the script from at least two regions/networks (for example US-East and EU).
Compare for each endpoint:

- `time_total` (curl)
- `Server-Timing` total and DB segments
- `X-Upstream-Region`

Heuristic:

- high `time_total` but low server timings => mostly network/transport
- high `auth.getUser` or DB segments => backend/query bottleneck
- high client `loading_visible_duration` but low API timings => frontend loading gate issue

## 5) Next optimization decisions

- If `auth.getUser` dominates: reduce redundant auth checks per screen/flow.
- If DB segments dominate: index/query optimization and reduce payload volume.
- If client loading dominates: remove chained gates, reuse cached me/session data, avoid duplicated startup queries.

## 6) Supabase slow-query triage

Some outliers can be platform/meta queries (for example extension/type/function introspection) and are not always user-flow bottlenecks.

Use this order:

1. Prioritize application-table queries and RPC calls first.
2. Correlate slow-query timestamps with API request IDs / user flows.
3. Treat dashboard/meta introspection queries separately from product-path latency.
4. Keep `supabase inspect db outliers --linked` as routine visibility, but optimize based on user-facing impact first.
