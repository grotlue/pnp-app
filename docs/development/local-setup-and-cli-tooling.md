# Local Setup and CLI Tooling

Initial local setup for developers and required CLI tools for project workflows.

For a minimal AI-agent usage flow, see [AI Agent Quickstart](ai-agent-quickstart.md).

## Fast Path (New Developer)

Run these steps in order:

1. Install required tools from [Required Tools](#required-tools).
2. Run one-time project setup from [One-Time Project Setup](#one-time-project-setup).
3. Authenticate GitHub CLI using [GitHub CLI Setup](#github-cli-setup).
4. Install/sync project skills using [Orchestrator and Skills Setup](#orchestrator-and-skills-setup).
5. Start with `yarn orchestrator:auto --prompt "<your task>"`.

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

The local Supabase stack also starts Mailpit for auth emails.

- Mailpit UI/API base URL: `http://127.0.0.1:54324`
- Used by E2E auth flows to read confirmation/reset links.

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
cp -R skills/pnp-quality-gatekeeper ~/.codex/skills/
cp -R skills/pnp-pr-readiness ~/.codex/skills/
cp -R skills/pnp-pr-review ~/.codex/skills/
cp -R skills/pnp-docs-maintainer ~/.codex/skills/
```

2. Restart Codex to load newly installed skills.

3. Run orchestrator auto mode:

```bash
yarn orchestrator:auto --prompt "review PR 48"
```

4. Use planning conversation mode when needed:

```bash
yarn orchestrator:plan --prompt "Plan feature xy"
```

5. Manual contract mode (advanced only):

```bash
yarn orchestrator:example
yarn orchestrator:run --task path/to/task.json
```

Full usage: [Multi-Agent Orchestration](multi-agent-orchestration-mvp.md)

## Which Command To Use

Use this as default decision guide:

| Goal                                       | Best command                                                          | When to use                                    |
| ------------------------------------------ | --------------------------------------------------------------------- | ---------------------------------------------- |
| Deliver a feature/fix/refactor end-to-end  | `yarn orchestrator:auto --prompt "implement <task>"`                  | Default for most coding tasks                  |
| Review an existing PR                      | `yarn orchestrator:auto --prompt "review PR <number>"`                | Findings-first quality review                  |
| Plan first, execute later                  | `yarn orchestrator:plan --prompt "plan <task>"`                       | You want discussion/clarification before edits |
| Execute in conversational mode immediately | `yarn orchestrator:chat --prompt "<task>"`                            | You want interactive execution-focused chat    |
| Preview routing without running            | `yarn orchestrator:auto --prompt "<task>" --dry-run --print-analysis` | Validate profile/skills before execution       |
| Fully custom orchestration                 | `yarn orchestrator:run --task path/to/task.json`                      | Advanced/manual workstream control             |

Safety notes for all modes:

- High-risk prompts require `--confirm-risky`.
- Destructive commands are blocked unless `--allow-destructive` is explicitly set.
- `orchestrator:plan` and `orchestrator:chat` default to `--approval-policy untrusted`.
- `orchestrator:auto` defaults to `on-request`; use `--approval-policy untrusted` when you want stricter approval gating.
