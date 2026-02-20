"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/client/query-keys";
import type { ClientSession } from "@/lib/client/session";
import type { CharacterCreateInput } from "../types";
import {
  createCharacter,
  deleteCharacter,
  getCharacters,
} from "../queries/characters-screen.query";

const useCharactersScreen = (session: ClientSession | null) => {
  const queryClient = useQueryClient();
  const token = session?.accessToken ?? "no-session";
  const queryKey = queryKeys.charactersScreen(token);

  const charactersQuery = useQuery({
    queryKey,
    enabled: Boolean(session),
    queryFn: async () => {
      if (!session) {
        throw new Error("Missing session");
      }
      return getCharacters(session, { scope: "mine" });
    },
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey });
  };

  const createMutation = useMutation({
    mutationFn: async (input: CharacterCreateInput) => {
      if (!session) {
        throw new Error("Missing session");
      }
      return createCharacter(session, input);
    },
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: async (characterId: string) => {
      if (!session) {
        throw new Error("Missing session");
      }
      return deleteCharacter(session, characterId);
    },
    onSuccess: invalidate,
  });

  return {
    charactersQuery,
    createMutation,
    deleteMutation,
    anyPending: createMutation.isPending || deleteMutation.isPending,
  };
};

export { useCharactersScreen as default, useCharactersScreen };
