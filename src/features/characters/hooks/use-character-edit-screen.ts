"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import type { ClientSession } from "@/lib/client/session";
import type { CharacterUpdateInput } from "../types";
import {
  deleteCharacterFromEdit,
  getCharacterEditContext,
  updateCharacter,
} from "../queries/character-edit.query";

export function useCharacterEditScreen(session: ClientSession | null, characterId: string) {
  const editQuery = useQuery({
    queryKey: ["characters", "edit", characterId, session?.accessToken ?? "no-session"],
    enabled: Boolean(session),
    queryFn: async () => {
      if (!session) {
        throw new Error("Missing session");
      }
      return getCharacterEditContext(session, characterId);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (input: CharacterUpdateInput) => {
      if (!session) {
        throw new Error("Missing session");
      }
      return updateCharacter(session, characterId, input);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!session) {
        throw new Error("Missing session");
      }
      return deleteCharacterFromEdit(session, characterId);
    },
  });

  return {
    editQuery,
    updateMutation,
    deleteMutation,
    anyPending: updateMutation.isPending || deleteMutation.isPending,
  };
}
