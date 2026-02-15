import { apiRequest, unwrapApiResponse } from "@/lib/client/api";
import type { ClientSession } from "@/lib/client/session";
import type { AdminCreateUserInput, AdminUpdateUserInput, AdminUser } from "../types";

export async function listAdminUsers(session: ClientSession): Promise<AdminUser[]> {
  const response = await apiRequest<AdminUser[]>("/api/admin/users", { session });
  return unwrapApiResponse(response, "Failed to load users");
}

export async function createAdminUser(
  session: ClientSession,
  input: AdminCreateUserInput,
): Promise<{ userId: string }> {
  const response = await apiRequest<{ userId: string }>("/api/admin/users", {
    method: "POST",
    session,
    body: input,
  });
  return unwrapApiResponse(response, "Failed to create user");
}

export async function updateAdminUser(
  session: ClientSession,
  userId: string,
  input: AdminUpdateUserInput,
): Promise<{ updated: true }> {
  const response = await apiRequest<{ updated: true }>(`/api/admin/users/${userId}`, {
    method: "PATCH",
    session,
    body: input,
  });
  return unwrapApiResponse(response, "Failed to update user");
}

export async function deleteAdminUser(
  session: ClientSession,
  userId: string,
): Promise<{ deleted: true }> {
  const response = await apiRequest<{ deleted: true }>(`/api/admin/users/${userId}`, {
    method: "DELETE",
    session,
  });
  return unwrapApiResponse(response, "Failed to delete user");
}
