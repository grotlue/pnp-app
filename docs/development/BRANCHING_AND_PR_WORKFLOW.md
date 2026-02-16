# Branching and PR Workflow

This project uses a strict branch-first workflow.

## Rules

- Never implement changes directly on `main` or `production`.
- Every change must be done in a short-lived working branch.
- New working branches must always be cut from the current `main` branch.
- One branch should contain one coherent change package.
- When the package is complete, open a Pull Request.

## Branch naming

Use one of:

- `feat/<scope>-<short-description>`
- `fix/<scope>-<short-description>`
- `refactor/<scope>-<short-description>`
- `chore/<scope>-<short-description>`
- `docs/<scope>-<short-description>`

Examples:

- `feat/characters-private-visibility`
- `fix/auth-logout-token-error`
- `refactor/admin-form-modules`
- `docs/deployment-workflow-update`

## Standard flow

1. Update local `main` from remote:
   - `git checkout main`
   - `git pull origin main`
2. Create a branch for the task from that updated `main`.
3. Implement and verify:
   - `yarn typecheck`
   - `yarn lint`
   - `yarn test:run`
   - `yarn build` (for release-impacting changes)
4. Commit with conventional commit messages.
   - For large refactors, split work into several sensible commits (for example: structure moves, functional changes, cleanup, docs) instead of one large commit.
   - Each commit should be understandable and safely revertable on its own.
5. Open a PR with scope, verification, and risk notes.
6. Merge only after required checks and approvals pass.

## Scope mismatch rule

If a new prompt/task is not aligned with the current branch theme:

- Prefer creating a new branch.
- Keep unrelated work out of the current PR.

## Agent-specific enforcement

Automated agents must:

- check current branch before editing files
- ensure new branch base is updated `main` (`origin/main`)
- create a new branch if currently on `main` or `production`
- ask before branching when task scope does not match current branch
- open a PR after finishing a coherent change package
