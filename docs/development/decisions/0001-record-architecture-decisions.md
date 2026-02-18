# ADR-0001: Record Architecture Decisions

- Status: Accepted
- Date: 2026-02-18
- Owner: @team
- Supersedes: none
- Superseded by: none

## Context

Project architecture, security, testing, and deployment guardrails are documented, but decision intent can get lost over time. Without a decision log, future changes risk re-opening already-settled tradeoffs.

## Decision

We adopt a lightweight ADR process in `docs/development/decisions/`:

- one ADR per architecture-significant decision
- fixed ADR template with context, decision, consequences, alternatives
- explicit lifecycle status (`Proposed`, `Accepted`, `Rejected`, `Superseded`)
- central index in `docs/development/decisions/README.md`

PRs that change architecture/security/runtime boundaries must link an ADR (new or existing), or explicitly state why no ADR is needed.

## Consequences

- Better traceability for architectural intent and tradeoffs.
- Faster onboarding and review for non-trivial design changes.
- Slight overhead: architectural PRs require ADR maintenance.

## Alternatives Considered

- Keep all decisions only in `docs/app-architecture.md`: rejected, because history and rationale are hard to track.
- Capture decisions only in PR descriptions/issues: rejected, because decision history becomes fragmented and harder to discover.
