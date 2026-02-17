import { apiRequest, unwrapApiResponse } from "@/lib/client/api";
import type { ClientSession } from "@/lib/client/session";
import type { Character, CharacterCreateInput } from "../types";

type GetCharactersOptions = {
  scope?: "mine" | "public";
};

export async function getCharacters(
  session: ClientSession,
  options?: GetCharactersOptions,
): Promise<Character[]> {
  const searchParams = new URLSearchParams();
  if (options?.scope) {
    searchParams.set("scope", options.scope);
  }
  const path =
    searchParams.size > 0
      ? `/api/characters?${searchParams.toString()}`
      : "/api/characters";

  const response = await apiRequest<Character[]>(path, { session });
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
  const response = await apiRequest<{ deleted: boolean }>(
    `/api/characters/${characterId}`,
    {
      method: "DELETE",
      session,
    },
  );
  return unwrapApiResponse(response, "Failed to delete character");
}
