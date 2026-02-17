import { apiRequest, unwrapApiResponse } from "@/lib/client/api";
import type { ClientSession } from "@/lib/client/session";
import type {
  AdminMfaEnrollResponse,
  AdminMfaStatusResponse,
  AdminMfaVerifyResponse,
} from "@/features/users/types";

export async function getAdminMfaStatus(
  session: ClientSession,
): Promise<AdminMfaStatusResponse> {
  const response = await apiRequest<AdminMfaStatusResponse>(
    "/api/auth/mfa/totp",
    { session },
  );
  return unwrapApiResponse(response, "Failed to load MFA status");
}

export async function enrollAdminTotp(
  session: ClientSession,
  input?: { friendlyName?: string },
): Promise<AdminMfaEnrollResponse> {
  const response = await apiRequest<AdminMfaEnrollResponse>(
    "/api/auth/mfa/totp",
    {
      method: "POST",
      session,
      body: input ?? {},
    },
  );
  return unwrapApiResponse(response, "Failed to start MFA setup");
}

export async function verifyAdminTotp(
  session: ClientSession,
  input: { factorId: string; code: string },
): Promise<AdminMfaVerifyResponse> {
  const response = await apiRequest<AdminMfaVerifyResponse>(
    "/api/auth/mfa/totp",
    {
      method: "PATCH",
      session,
      body: input,
    },
  );
  return unwrapApiResponse(response, "Failed to verify MFA code");
}
