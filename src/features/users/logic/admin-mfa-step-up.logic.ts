import type { AdminMfaStatusResponse } from "@/features/users/types";

type AdminMfaStepUpDecision =
  | { kind: "none" }
  | { kind: "setup" }
  | { kind: "challenge"; factorId: string };

type ResolveAdminMfaStepUpDecisionInput = {
  role?: "user" | "admin";
  mfaStatus: AdminMfaStatusResponse | null;
};

const resolveAdminMfaStepUpDecision = (
  input: ResolveAdminMfaStepUpDecisionInput,
): AdminMfaStepUpDecision => {
  if (input.role !== "admin") {
    return { kind: "none" };
  }

  if (!input.mfaStatus || !input.mfaStatus.mfaRequired) {
    return { kind: "none" };
  }

  if (input.mfaStatus.currentLevel === "aal2") {
    return { kind: "none" };
  }

  const verifiedFactor = input.mfaStatus.factors.find(
    (factor) => factor.status === "verified",
  );
  if (!verifiedFactor) {
    return { kind: "setup" };
  }

  return {
    kind: "challenge",
    factorId: verifiedFactor.id,
  };
};

const sanitizeReturnToPath = (
  path: string | undefined,
  fallback: string,
): string => {
  if (!path) {
    return fallback;
  }

  if (!path.startsWith("/") || path.startsWith("//")) {
    return fallback;
  }

  return path;
};

export {
  resolveAdminMfaStepUpDecision,
  sanitizeReturnToPath,
  type AdminMfaStepUpDecision,
};
