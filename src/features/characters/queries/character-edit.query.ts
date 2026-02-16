import { apiRequest, unwrapApiResponse } from "@/lib/client/api";
import type { ClientSession } from "@/lib/client/session";
import type { Character, CharacterUpdateInput } from "../types";
import type { MeResponse } from "@/features/users/types";

export async function getCharacterEditContext(
  session: ClientSession,
  characterId: string,
): Promise<{ me: MeResponse; character: Character }> {
  const [meResponse, characterResponse] = await Promise.all([
    apiRequest<MeResponse>("/api/me", { session }),
    apiRequest<Character>(`/api/characters/${characterId}`, { session }),
  ]);

  return {
    me: unwrapApiResponse(meResponse, "Failed to load user"),
    character: unwrapApiResponse(characterResponse, "Failed to load character"),
  };
}

export async function updateCharacter(
  session: ClientSession,
  characterId: string,
  input: CharacterUpdateInput,
): Promise<Character> {
  const response = await apiRequest<Character>(`/api/characters/${characterId}`, {
    method: "PATCH",
    session,
    body: input,
  });
  return unwrapApiResponse(response, "Failed to update character");
}

export async function deleteCharacterFromEdit(
  session: ClientSession,
  characterId: string,
): Promise<{ deleted: boolean }> {
  const response = await apiRequest<{ deleted: boolean }>(`/api/characters/${characterId}`, {
    method: "DELETE",
    session,
  });
  return unwrapApiResponse(response, "Failed to delete character");
}

export async function createCharacterAvatarSignedUpload(
  session: ClientSession,
  characterId: string,
  input: {
    fileName: string;
    width: number;
    height: number;
    fileSize: number;
  },
): Promise<{ token: string; signedUrl: string; path: string }> {
  const response = await apiRequest<{ token: string; signedUrl: string; path: string }>(
    "/api/storage/character-images/signed-upload",
    {
      method: "POST",
      session,
      body: {
        characterId,
        ...input,
      },
    },
  );
  return unwrapApiResponse(response, "Failed to prepare character image upload");
}
