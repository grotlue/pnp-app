# CHECKLISTE: Dateien von einem Online-Rechner nach `pnp-app/` kopieren

## 1) Projekt-Basis (Pflicht)
- `package.json`
- `package-lock.json` (oder `npm-shrinkwrap.json`)
- `next.config.*`
- `tsconfig.json`
- `postcss.config.*`
- `tailwind.config.*`
- `.eslintrc*` / `eslint.config.*` (falls genutzt)
- `components.json` (shadcn/ui)

## 2) App-Quellcode (Pflicht)
- kompletter `src/` Ordner
- kompletter `public/` Ordner

## 3) Styling (Pflicht)
- globale Styles, z. B. `src/app/globals.css`
- ggf. zusätzliche CSS-Dateien

## 4) Umgebung (lokal setzen, nicht aus Repo)
- `.env.local` mit:
  - `NEXT_PUBLIC_SUPABASE_URL=...`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY=...`

## 5) Offline-Installation (nur mit vorhandenem Cache)
Im Zielordner `pnp-app/` ausführen:
- `npm ci --prefer-offline --no-audit --no-fund`

Wenn das fehlschlägt, auf dem Online-Rechner zusätzlich sicherstellen:
- Lockfile ist aktuell
- alle Abhängigkeiten im npm-Cache vorbereitet

## 6) Start
- `npm run dev`

