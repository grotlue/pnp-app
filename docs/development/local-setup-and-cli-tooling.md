# Local Setup and CLI Tooling

Initial local setup for developers and required CLI tools for project workflows.

For a minimal AI-agent usage flow, see [`docs/development/ai-agent-quickstart.md`](ai-agent-quickstart.md).

## Required Tools

| Tool              | Why it is needed                  | Check                |
| ----------------- | --------------------------------- | -------------------- |
| `git`             | branch workflow, commits, PR prep | `git --version`      |
| `node` (20+)      | app runtime/tooling               | `node --version`     |
| `yarn` (1.22.x)   | package manager used by this repo | `yarn --version`     |
| Docker Desktop    | local Supabase stack              | `docker --version`   |
| Supabase CLI      | local DB reset, migration, lint   | `supabase --version` |
| GitHub CLI (`gh`) | PR creation, run/check inspection | `gh --version`       |

## Optional Tools

| Tool                  | When needed                        | Check              |
| --------------------- | ---------------------------------- | ------------------ |
| Vercel CLI (`vercel`) | manual preview/deploy debugging    | `vercel --version` |
| Codex CLI             | local skill orchestration workflow | `codex --version`  |

Use official install docs:

- Git: <https://git-scm.com/downloads>
- Node.js: <https://nodejs.org/en/download>
- Yarn classic: <https://classic.yarnpkg.com/lang/en/docs/install/>
- Docker Desktop: <https://docs.docker.com/desktop/>
- Supabase CLI: <https://supabase.com/docs/guides/cli>
- GitHub CLI: <https://cli.github.com/>
- Vercel CLI: <https://vercel.com/docs/cli>

## One-Time Project Setup

1. Install dependencies:

```bash
yarn install --frozen-lockfile
```

2. Create local env and start local Supabase:

```bash
cp .env.example .env.local
yarn supabase:start
yarn supabase:env:local
```

3. Run app:

```bash
yarn dev
```

4. Verify baseline:

```bash
yarn typecheck
yarn lint
yarn test:run
yarn build
```

## GitHub CLI Setup

Authenticate once:

```bash
gh auth login
```

Common workflow commands:

```bash
gh pr status
gh run list --limit 10
gh run watch <run-id>
```

## Orchestrator and Skills Setup

For local skill-based orchestration with Codex:

1. Sync project skills into Codex skills directory:

```bash
mkdir -p ~/.codex/skills
cp -R skills/pnp-orchestrator ~/.codex/skills/
cp -R skills/pnp-feature-delivery ~/.codex/skills/
cp -R skills/pnp-db-migration-guardrails ~/.codex/skills/
cp -R skills/pnp-pr-readiness ~/.codex/skills/
cp -R skills/pnp-pr-review ~/.codex/skills/
cp -R skills/pnp-docs-maintainer ~/.codex/skills/
```

2. Restart Codex to load newly installed skills.

3. Run orchestrator MVP:

```bash
yarn orchestrator:example
```
