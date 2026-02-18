---
name: pnp-db-migration-guardrails
description: Supabase migration and RLS guardrail workflow for pnp-app. Use when schema, RLS policies, indexes, or DB runtime behavior change, including preview/production deployment-readiness checks.
---

# PNP DB Migration Guardrails

Apply schema changes with strict safety checks.

## Execute Workflow

1. Create migration with clear intent.
2. Ensure every new public/API-exposed table enables RLS in the same migration.
3. Add covering index for new foreign keys in `public`.
4. Validate locally or linked environment as applicable:
   - `supabase db reset --local --no-seed --yes`
   - `supabase db lint --schema public --fail-on warning`
   - `scripts/check-unindexed-foreign-keys.sh`
5. Review outliers when changes may impact user-facing queries:
   - `supabase inspect db outliers --linked`

## Enforce Security and Performance

1. Keep policies least-privilege.
2. Avoid multiple permissive policies where one merged policy is sufficient.
3. Preserve server-auth + RLS model alignment.
