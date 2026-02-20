import { apiRequest, unwrapApiResponse } from "@/lib/client/api";
import type { ClientSession } from "@/lib/client/session";
import type {
  AdminCreateUserInput,
  AdminUpdateUserInput,
  AdminUser,
} from "../types";

const listAdminUsers = async (session: ClientSession): Promise<AdminUser[]> => {
  const response = await apiRequest<AdminUser[]>("/api/admin/users", {
    session,
  });
  return unwrapApiResponse(response, "Failed to load users");
};

const createAdminUser = async (
  session: ClientSession,
  input: AdminCreateUserInput,
): Promise<{ userId: string }> => {
  const response = await apiRequest<{ userId: string }>("/api/admin/users", {
    method: "POST",
    session,
    body: input,
  });
  return unwrapApiResponse(response, "Failed to create user");
};

const updateAdminUser = async (
  session: ClientSession,
  userId: string,
  input: AdminUpdateUserInput,
): Promise<{ updated: true }> => {
  const response = await apiRequest<{ updated: true }>(
    `/api/admin/users/${userId}`,
    {
      method: "PATCH",
      session,
      body: input,
    },
  );
  return unwrapApiResponse(response, "Failed to update user");
};

const deleteAdminUser = async (
  session: ClientSession,
  userId: string,
): Promise<{ deleted: true }> => {
  const response = await apiRequest<{ deleted: true }>(
    `/api/admin/users/${userId}`,
    {
      method: "DELETE",
      session,
    },
  );
  return unwrapApiResponse(response, "Failed to delete user");
};

export { createAdminUser, deleteAdminUser, listAdminUsers, updateAdminUser };
