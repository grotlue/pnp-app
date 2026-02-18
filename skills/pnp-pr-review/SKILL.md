---
name: pnp-pr-review
description: Structured code review for pnp-app pull requests. Use when the user asks for a review to prioritize correctness, regressions, authorization boundaries, cache invalidation, DB risk, and missing tests.
---

# PNP PR Review

Perform a findings-first review.

## Execute Workflow

1. Inspect PR diff and changed files.
2. Prioritize findings by severity:
   - correctness bugs
   - security/authz regressions
   - cache/data consistency issues
   - performance regressions
   - missing tests for changed behavior
3. Include precise file references for each finding.
4. Separate findings from suggestions.
5. State explicitly when no findings are detected and list residual risks.

## Review Output Contract

1. Findings first, ordered by severity.
2. Open questions/assumptions second.
3. Brief change summary last.
