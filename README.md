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

- Documentation hub: [Documentation Hub](docs/README.md)
- Developer setup and tooling: [Local Setup and CLI Tooling](docs/development/local-setup-and-cli-tooling.md)
- AI agent usage (auto mode + planning mode): [AI Agent Quickstart](docs/development/ai-agent-quickstart.md)
- AI agent workflow rules: [Agent Rules](AGENTS.md)
