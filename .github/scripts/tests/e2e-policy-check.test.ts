import { describe, expect, it } from "vitest";

import { evaluateE2EPolicy } from "../e2e-policy-check.mjs";

function buildPrBody({
  linkedIssue,
  flowImpact = "existing",
  matrixRow,
  noIssueAc = "- ...",
  noIssueHappyPaths = "- ...",
}: {
  linkedIssue: string;
  flowImpact?: "existing" | "new";
  matrixRow: string;
  noIssueAc?: string;
  noIssueHappyPaths?: string;
}) {
  const existingChecked = flowImpact === "existing" ? "x" : " ";
  const newChecked = flowImpact === "new" ? "x" : " ";

  return `## Summary

- test

## Linked Issue(s)

${linkedIssue}

## Flow Impact

- [ ] No user-flow impact
- [${existingChecked}] Existing flow changed
- [${newChecked}] New flow added

## E2E Coverage Matrix

| AC / User Flow Ref | Scenario ID | Test status | Why E2E vs feature test |
| --- | --- | --- | --- |
${matrixRow}

## PR Acceptance Criteria (Required When No Linked Issue)

${noIssueAc}

## PR Happy Paths (Required When No Linked Issue)

${noIssueHappyPaths}
`;
}

describe("e2e policy check", () => {
  it("passes linked-issue PR when matrix has concrete AC/flow mapping", () => {
    const result = evaluateE2EPolicy({
      prBody: buildPrBody({
        linkedIssue: "- #29",
        matrixRow:
          "| ISSUE-29 AC-1: linked issue matrix validation | FLOW-AUTH-LOGIN-ENTRY | Existing | user-visible login entry |",
      }),
      changedFiles: ["src/app/login/page.tsx"],
      availableScenarioIds: new Set(["FLOW-AUTH-LOGIN-ENTRY"]),
    });

    expect(result.errors).toEqual([]);
  });

  it("fails linked-issue PR when matrix misses concrete AC/user-flow ref", () => {
    const result = evaluateE2EPolicy({
      prBody: buildPrBody({
        linkedIssue: "- #29",
        matrixRow:
          "| AC-1 | FLOW-AUTH-LOGIN-ENTRY | Existing | user-visible login entry |",
      }),
      changedFiles: ["src/app/login/page.tsx"],
      availableScenarioIds: new Set(["FLOW-AUTH-LOGIN-ENTRY"]),
    });

    expect(result.errors).toContain(
      "Linked Issue PRs must map each scenario to a concrete AC/User Flow reference in 'E2E Coverage Matrix' column 'AC / User Flow Ref'.",
    );
  });

  it("fails no-issue PR when matrix only uses Existing status", () => {
    const result = evaluateE2EPolicy({
      prBody: buildPrBody({
        linkedIssue: "- No linked issue",
        matrixRow:
          "| Login flow | FLOW-AUTH-LOGIN-ENTRY | Existing | user-visible login entry |",
        noIssueAc: "- Given a changed login flow, users can still sign in",
        noIssueHappyPaths: "- User signs in with valid credentials",
      }),
      changedFiles: ["src/app/login/page.tsx", "tests/e2e/smoke-home.spec.ts"],
      availableScenarioIds: new Set(["FLOW-AUTH-LOGIN-ENTRY"]),
    });

    expect(result.errors).toContain(
      "No linked issue detected. At least one scenario in 'E2E Coverage Matrix' must be marked as 'New' or 'Updated' (only 'Existing' is not allowed).",
    );
  });

  it("passes no-issue PR when matrix marks scenario as Updated", () => {
    const result = evaluateE2EPolicy({
      prBody: buildPrBody({
        linkedIssue: "- No linked issue",
        matrixRow:
          "| Login flow update | FLOW-AUTH-LOGIN-ENTRY | Updated | user-visible login entry |",
        noIssueAc: "- Given updated auth copy, sign-in still succeeds",
        noIssueHappyPaths: "- User signs in and lands on dashboard",
      }),
      changedFiles: ["src/app/login/page.tsx", "tests/e2e/smoke-home.spec.ts"],
      availableScenarioIds: new Set(["FLOW-AUTH-LOGIN-ENTRY"]),
    });

    expect(result.errors).toEqual([]);
  });
});
