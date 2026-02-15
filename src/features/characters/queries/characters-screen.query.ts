import { apiRequest, unwrapApiResponse } from "@/lib/client/api";
import type { ClientSession } from "@/lib/client/session";
import type { Character, CharacterCreateInput } from "../types";

export async function getCharacters(session: ClientSession): Promise<Character[]> {
  const response = await apiRequest<Character[]>("/api/characters", { session });
  return unwrapApiResponse(response, "Failed to load characters");
}

export async function createCharacter(
  session: ClientSession,
  input: CharacterCreateInput,
): Promise<Character> {
  const response = await apiRequest<Character>("/api/characters", {
    method: "POST",
    session,
    body: input,
  });
  return unwrapApiResponse(response, "Failed to create character");
}

export async function deleteCharacter(
  session: ClientSession,
  characterId: string,
): Promise<{ deleted: boolean }> {
  const response = await apiRequest<{ deleted: boolean }>(`/api/characters/${characterId}`, {
    method: "DELETE",
    session,
  });
  return unwrapApiResponse(response, "Failed to delete character");
}
