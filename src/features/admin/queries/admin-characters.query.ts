import { apiRequest, unwrapApiResponse } from "@/lib/client/api";
import type { ClientSession } from "@/lib/client/session";
import type {
  AdminCharacter,
  AdminCreateCharacterInput,
  AdminUpdateCharacterInput,
} from "../types";

const listAdminCharacters = async (
  session: ClientSession,
): Promise<AdminCharacter[]> => {
  const response = await apiRequest<AdminCharacter[]>("/api/admin/characters", {
    session,
  });
  return unwrapApiResponse(response, "Failed to load characters");
};

const createAdminCharacter = async (
  session: ClientSession,
  input: AdminCreateCharacterInput,
): Promise<AdminCharacter> => {
  const response = await apiRequest<AdminCharacter>("/api/admin/characters", {
    method: "POST",
    session,
    body: input,
  });
  return unwrapApiResponse(response, "Failed to create character");
};

const updateAdminCharacter = async (
  session: ClientSession,
  characterId: string,
  input: AdminUpdateCharacterInput,
): Promise<AdminCharacter> => {
  const response = await apiRequest<AdminCharacter>(
    `/api/admin/characters/${characterId}`,
    {
      method: "PATCH",
      session,
      body: input,
    },
  );
  return unwrapApiResponse(response, "Failed to update character");
};

const deleteAdminCharacter = async (
  session: ClientSession,
  characterId: string,
): Promise<{ deleted: true }> => {
  const response = await apiRequest<{ deleted: true }>(
    `/api/admin/characters/${characterId}`,
    {
      method: "DELETE",
      session,
    },
  );
  return unwrapApiResponse(response, "Failed to delete character");
};

export {
  createAdminCharacter,
  deleteAdminCharacter,
  listAdminCharacters,
  updateAdminCharacter,
};
