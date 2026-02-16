import { normalizeTotpCode } from "@/lib/api/auth-validation";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api/http";
import { hasRequiredFields } from "@/lib/api/validation";
import { isAdminMfaRequired } from "@/server/auth/auth-hardening";
import { getUserRole } from "@/server/auth/get-user-role";
import { requireAuth } from "@/server/auth/require-auth";
import { setSessionCookies } from "@/server/auth/session-cookie";
import { enforceRateLimit } from "@/server/rate-limit/enforce-rate-limit";

type EnrollTotpBody = {
  friendlyName?: string;
};

type VerifyTotpBody = {
  factorId?: string;
  code?: string;
};

function normalizeFriendlyName(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  return trimmed.slice(0, 64);
}

function isCompleteTotpEnrollment(data: unknown): data is {
  id: string;
  friendly_name?: string;
  totp: { qr_code: string; secret: string; uri: string };
} {
  if (!data || typeof data !== "object") {
    return false;
  }

  const candidate = data as {
    id?: unknown;
    totp?: { qr_code?: unknown; secret?: unknown; uri?: unknown } | null;
  };

  return (
    typeof candidate.id === "string" &&
    !!candidate.totp &&
    typeof candidate.totp.qr_code === "string" &&
    typeof candidate.totp.secret === "string" &&
    typeof candidate.totp.uri === "string"
  );
}

function isCompleteMfaVerification(data: unknown): data is {
  access_token: string;
  refresh_token?: string;
} {
  if (!data || typeof data !== "object") {
    return false;
  }

  const candidate = data as { access_token?: unknown; refresh_token?: unknown };
  if (typeof candidate.access_token !== "string") {
    return false;
  }

  if (candidate.refresh_token !== undefined && typeof candidate.refresh_token !== "string") {
    return false;
  }

  return true;
}

export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if ("response" in auth) {
    return auth.response;
  }

  const roleResult = await getUserRole(auth.context);
  if (roleResult.errorMessage) {
    return jsonError(500, "mfa_status_failed", roleResult.errorMessage);
  }
  if (roleResult.role !== "admin") {
    return jsonError(403, "admin_required", "Admin access required");
  }

  const [aalResult, factorsResult] = await Promise.all([
    auth.context.client.auth.mfa.getAuthenticatorAssuranceLevel(auth.context.accessToken),
    auth.context.client.auth.mfa.listFactors(),
  ]);

  if (aalResult.error) {
    return jsonError(400, "mfa_status_failed", aalResult.error.message);
  }
  if (factorsResult.error) {
    return jsonError(400, "mfa_status_failed", factorsResult.error.message);
  }

  const allFactors = factorsResult.data?.all ?? [];
  const totpFactors = allFactors
    .filter((factor) => factor.factor_type === "totp")
    .map((factor) => ({
      id: factor.id,
      friendlyName: factor.friendly_name ?? null,
      status: factor.status,
      createdAt: factor.created_at,
      lastChallengedAt: factor.last_challenged_at ?? null,
    }));

  return jsonOk({
    isAdmin: true,
    mfaRequired: isAdminMfaRequired(),
    currentLevel: aalResult.data?.currentLevel ?? null,
    nextLevel: aalResult.data?.nextLevel ?? null,
    hasVerifiedTotp: totpFactors.some((factor) => factor.status === "verified"),
    factors: totpFactors,
  });
}

export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if ("response" in auth) {
    return auth.response;
  }

  const roleResult = await getUserRole(auth.context);
  if (roleResult.errorMessage) {
    return jsonError(500, "mfa_enroll_failed", roleResult.errorMessage);
  }
  if (roleResult.role !== "admin") {
    return jsonError(403, "admin_required", "Admin access required");
  }

  const rateLimited = await enforceRateLimit({
    request,
    route: "auth:mfa:totp:enroll",
    limit: 5,
    windowMs: 10 * 60_000,
    userId: auth.context.user.id,
  });
  if (rateLimited) {
    return rateLimited;
  }

  const body = await parseJsonBody<EnrollTotpBody>(request);
  const friendlyName = normalizeFriendlyName(body?.friendlyName);

  const { data, error } = await auth.context.client.auth.mfa.enroll({
    factorType: "totp",
    issuer: "pnp-app",
    friendlyName,
  });

  if (error) {
    return jsonError(400, "mfa_enroll_failed", error.message);
  }

  if (!isCompleteTotpEnrollment(data)) {
    return jsonError(400, "mfa_enroll_failed", "MFA enrollment response was incomplete");
  }

  return jsonOk({
    factorId: data.id,
    friendlyName: data.friendly_name ?? null,
    qrCode: data.totp.qr_code,
    secret: data.totp.secret,
    uri: data.totp.uri,
  });
}

export async function PATCH(request: Request) {
  const auth = await requireAuth(request);
  if ("response" in auth) {
    return auth.response;
  }

  const roleResult = await getUserRole(auth.context);
  if (roleResult.errorMessage) {
    return jsonError(500, "mfa_verify_failed", roleResult.errorMessage);
  }
  if (roleResult.role !== "admin") {
    return jsonError(403, "admin_required", "Admin access required");
  }

  const rateLimited = await enforceRateLimit({
    request,
    route: "auth:mfa:totp:verify",
    limit: 10,
    windowMs: 10 * 60_000,
    userId: auth.context.user.id,
  });
  if (rateLimited) {
    return rateLimited;
  }

  const body = await parseJsonBody<VerifyTotpBody>(request);
  if (!hasRequiredFields(body, ["factorId", "code"])) {
    return jsonError(400, "invalid_payload", "factorId and code are required");
  }

  const normalizedCode = normalizeTotpCode(body.code);
  if (!normalizedCode) {
    return jsonError(400, "invalid_payload", "valid code is required");
  }

  const { data: challengeData, error: challengeError } = await auth.context.client.auth.mfa.challenge({
    factorId: body.factorId,
  });
  if (challengeError || !challengeData) {
    return jsonError(400, "mfa_verify_failed", challengeError?.message ?? "MFA challenge failed");
  }

  const { data, error } = await auth.context.client.auth.mfa.verify({
    factorId: body.factorId,
    challengeId: challengeData.id,
    code: normalizedCode,
  });

  if (error) {
    return jsonError(400, "mfa_verify_failed", error.message);
  }

  if (!isCompleteMfaVerification(data)) {
    return jsonError(400, "mfa_verify_failed", "MFA verification response was incomplete");
  }

  return setSessionCookies(
    jsonOk({
      verified: true,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
    }),
    {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
    },
  );
}
