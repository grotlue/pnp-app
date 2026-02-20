import { describe, expect, it } from "vitest";
import {
  resolveAdminMfaStepUpDecision,
  sanitizeReturnToPath,
} from "../admin-mfa-step-up.logic";
import type { AdminMfaStatusResponse } from "@/features/users/types";

const buildMfaStatus = (
  overrides?: Partial<AdminMfaStatusResponse>,
): AdminMfaStatusResponse => {
  return {
    isAdmin: true,
    mfaRequired: true,
    currentLevel: "aal1",
    nextLevel: "aal2",
    hasVerifiedTotp: true,
    factors: [
      {
        id: "factor-1",
        friendlyName: "authenticator",
        status: "verified",
        createdAt: "2026-01-01T00:00:00.000Z",
        lastChallengedAt: null,
      },
    ],
    ...overrides,
  };
};

describe("resolveAdminMfaStepUpDecision", () => {
  it("returns none for non-admin users", () => {
    expect(
      resolveAdminMfaStepUpDecision({
        role: "user",
        mfaStatus: buildMfaStatus(),
      }),
    ).toEqual({ kind: "none" });
  });

  it("returns none when MFA status is missing", () => {
    expect(
      resolveAdminMfaStepUpDecision({
        role: "admin",
        mfaStatus: null,
      }),
    ).toEqual({ kind: "none" });
  });

  it("returns none when admin MFA is not required", () => {
    expect(
      resolveAdminMfaStepUpDecision({
        role: "admin",
        mfaStatus: buildMfaStatus({ mfaRequired: false }),
      }),
    ).toEqual({ kind: "none" });
  });

  it("returns none when current level is already aal2", () => {
    expect(
      resolveAdminMfaStepUpDecision({
        role: "admin",
        mfaStatus: buildMfaStatus({ currentLevel: "aal2" }),
      }),
    ).toEqual({ kind: "none" });
  });

  it("returns setup when no verified factor exists", () => {
    expect(
      resolveAdminMfaStepUpDecision({
        role: "admin",
        mfaStatus: buildMfaStatus({
          hasVerifiedTotp: false,
          factors: [
            {
              id: "factor-unverified",
              friendlyName: "authenticator",
              status: "unverified",
              createdAt: "2026-01-01T00:00:00.000Z",
              lastChallengedAt: null,
            },
          ],
        }),
      }),
    ).toEqual({ kind: "setup" });
  });

  it("returns challenge with verified factor id when step-up is required", () => {
    expect(
      resolveAdminMfaStepUpDecision({
        role: "admin",
        mfaStatus: buildMfaStatus(),
      }),
    ).toEqual({ kind: "challenge", factorId: "factor-1" });
  });
});

describe("sanitizeReturnToPath", () => {
  it("returns fallback when path is undefined", () => {
    expect(sanitizeReturnToPath(undefined, "/admin/users")).toBe(
      "/admin/users",
    );
  });

  it("returns fallback when path is not absolute", () => {
    expect(sanitizeReturnToPath("admin/users", "/admin/users")).toBe(
      "/admin/users",
    );
  });

  it("returns fallback for protocol-relative paths", () => {
    expect(sanitizeReturnToPath("//malicious.tld", "/admin/users")).toBe(
      "/admin/users",
    );
  });

  it("returns path when it is an absolute in-app route", () => {
    expect(sanitizeReturnToPath("/admin/users", "/admin")).toBe("/admin/users");
  });
});
