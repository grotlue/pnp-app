"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ClientSession } from "@/lib/client/session";
import { queryKeys } from "@/lib/client/query-keys";
import { getMe } from "@/features/users/queries/users-profile.query";
import type { CharacterUpdateInput } from "../types";
import {
  deleteCharacterFromEdit,
  getCharacterEditContext,
  updateCharacter,
} from "../queries/character-edit.query";

const useCharacterEditScreen = (
  session: ClientSession | null,
  characterId: string,
) => {
  const queryClient = useQueryClient();
  const token = session?.accessToken ?? "no-session";
  const editQueryKey = queryKeys.characterEdit(characterId, token);
  const detailQueryKey = queryKeys.characterDetail(characterId, token);
  const charactersScreenQueryKey = queryKeys.charactersScreen(token);

  const invalidateCharacterData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: editQueryKey }),
      queryClient.invalidateQueries({ queryKey: detailQueryKey }),
      queryClient.invalidateQueries({ queryKey: charactersScreenQueryKey }),
    ]);
  };

  const editQuery = useQuery({
    queryKey: editQueryKey,
    enabled: Boolean(session),
    queryFn: async () => {
      if (!session) {
        throw new Error("Missing session");
      }
      const me = await queryClient.ensureQueryData({
        queryKey: queryKeys.me(token),
        staleTime: 60_000,
        queryFn: async () => getMe(session),
      });
      return getCharacterEditContext(session, characterId, me);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (input: CharacterUpdateInput) => {
      if (!session) {
        throw new Error("Missing session");
      }
      return updateCharacter(session, characterId, input);
    },
    onSuccess: invalidateCharacterData,
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!session) {
        throw new Error("Missing session");
      }
      return deleteCharacterFromEdit(session, characterId);
    },
    onSuccess: invalidateCharacterData,
  });

  return {
    editQuery,
    updateMutation,
    deleteMutation,
    anyPending: updateMutation.isPending || deleteMutation.isPending,
  };
};

export { useCharacterEditScreen as default, useCharacterEditScreen };
