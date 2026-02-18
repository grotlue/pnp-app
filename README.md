# pnp-app

Next.js App Router MVP for users, campaigns, characters, relationships, and notifications.

## Quickstart

```bash
cp .env.example .env.local
yarn supabase:start
yarn supabase:env:local
yarn dev
```

## Quality Gates

```bash
yarn typecheck
yarn lint
yarn test:run
yarn build
```

## Documentation

- Development index: `docs/development/README.md`
- Testing index: `docs/testing/README.md`
- Architecture: `docs/app-architecture.md`
- Agent-only workflow and constraints: `AGENTS.md`
