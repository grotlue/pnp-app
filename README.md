# pnp-app

Next.js + TypeScript + Tailwind + shadcn/ui + Supabase.

## Zielbild

- Lokal: Supabase läuft in Docker (über Supabase CLI).
- Cloud: Gleiche DB-Struktur per Migrationen auf ein kostenloses Supabase-Projekt deployen.

## Voraussetzungen

- Node.js + npm
- Docker Desktop (muss laufen)

## Lokale Entwicklung mit Supabase (Docker)

1. Supabase lokal starten:

```bash
npm run supabase:start
```

2. Frontend-Umgebungsvariablen aus lokalem Stack in `.env.local` schreiben:

```bash
npm run supabase:env:local
```

3. Next.js starten:

```bash
npm run dev
```

Nützliche Kommandos:

```bash
npm run supabase:status
npm run supabase:stop
npm run supabase:db:reset
```

## Datenbank sauber versionieren

Migration anlegen:

```bash
npm run supabase:db:new -- add_profiles_table
```

Dann SQL in `supabase/migrations/<timestamp>_add_profiles_table.sql` ergänzen.

Lokal testen:

```bash
npm run supabase:db:reset
```

## Kostenlos auf Supabase Cloud deployen

1. Kostenloses Supabase-Projekt im Dashboard erstellen.
2. Project Ref kopieren (z. B. `abcdxyz12345`).
3. CLI anmelden:

```bash
npx supabase login
```

4. Projekt verlinken:

```bash
SUPABASE_PROJECT_REF=<dein-project-ref> npm run supabase:link
```

5. Migrationen in Cloud pushen:

```bash
npm run supabase:push
```

6. In `.env.local` auf Cloud-Werte wechseln:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<hosted-anon-key>
```

## Typen für die Datenbank (optional)

Nach dem Link auf das Cloud-Projekt:

```bash
npm run supabase:types
```

Dies schreibt Typen nach `src/types/database.ts`.

## Dateien

- Supabase CLI-Konfig: `supabase/config.toml`
- Migrationen: `supabase/migrations/`
- Seed: `supabase/seed.sql`
- Local-env Beispiel: `.env.local.example`
- Env-Generator: `scripts/update-local-supabase-env.sh`
