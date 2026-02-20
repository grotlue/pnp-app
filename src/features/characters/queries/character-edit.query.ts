import { apiRequest, unwrapApiResponse } from "@/lib/client/api";
import type { ClientSession } from "@/lib/client/session";
import type { Character, CharacterUpdateInput } from "../types";
import type { MeResponse } from "@/features/users/types";

const getCharacterEditContext = async (
  session: ClientSession,
  characterId: string,
  me: MeResponse,
): Promise<{ me: MeResponse; character: Character }> => {
  const [characterResponse] = await Promise.all([
    apiRequest<Character>(`/api/characters/${characterId}`, { session }),
  ]);

  return {
    me,
    character: unwrapApiResponse(characterResponse, "Failed to load character"),
  };
};

const updateCharacter = async (
  session: ClientSession,
  characterId: string,
  input: CharacterUpdateInput,
): Promise<Character> => {
  const response = await apiRequest<Character>(
    `/api/characters/${characterId}`,
    {
      method: "PATCH",
      session,
      body: input,
    },
  );
  return unwrapApiResponse(response, "Failed to update character");
};

const deleteCharacterFromEdit = async (
  session: ClientSession,
  characterId: string,
): Promise<{ deleted: boolean }> => {
  const response = await apiRequest<{ deleted: boolean }>(
    `/api/characters/${characterId}`,
    {
      method: "DELETE",
      session,
    },
  );
  return unwrapApiResponse(response, "Failed to delete character");
};

const createCharacterAvatarSignedUpload = async (
  session: ClientSession,
  characterId: string,
  input: {
    fileName: string;
    width: number;
    height: number;
    fileSize: number;
  },
): Promise<{ token: string; signedUrl: string; path: string }> => {
  const response = await apiRequest<{
    token: string;
    signedUrl: string;
    path: string;
  }>("/api/storage/character-images/signed-upload", {
    method: "POST",
    session,
    body: {
      characterId,
      ...input,
    },
  });
  return unwrapApiResponse(
    response,
    "Failed to prepare character image upload",
  );
};

export {
  createCharacterAvatarSignedUpload,
  deleteCharacterFromEdit,
  getCharacterEditContext,
  updateCharacter,
};
