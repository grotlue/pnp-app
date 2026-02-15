import { apiRequest, unwrapApiResponse } from "@/lib/client/api";
import type { ClientSession } from "@/lib/client/session";

export async function updateMyEmail(
  session: ClientSession,
  input: { newEmail: string },
): Promise<{ user: unknown }> {
  const response = await apiRequest<{ user: unknown }>("/api/me/settings/email", {
    method: "PATCH",
    session,
    body: input,
  });
  return unwrapApiResponse(response, "Failed to update email");
}

export async function updateMyPassword(
  session: ClientSession,
  input: { newPassword: string },
): Promise<{ user: unknown }> {
  const response = await apiRequest<{ user: unknown }>("/api/me/settings/password", {
    method: "PATCH",
    session,
    body: input,
  });
  return unwrapApiResponse(response, "Failed to update password");
}

export async function deleteMyAccount(
  session: ClientSession,
): Promise<{ deleted: boolean }> {
  const response = await apiRequest<{ deleted: boolean }>("/api/me", {
    method: "DELETE",
    session,
  });
  return unwrapApiResponse(response, "Failed to delete account");
}
