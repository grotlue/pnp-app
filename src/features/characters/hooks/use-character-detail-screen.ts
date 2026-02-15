"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ClientSession } from "@/lib/client/session";
import type { RelationshipDetail } from "@/features/relationships/types";
import {
  addRelationshipTimelineEntry,
  assignCharacterCampaign,
  createRelationship,
  deleteRelationship,
  getCharacterAvatarSignedUrl,
  getCharacterDetailContext,
  getCharacterRelationDetail,
  getRelationshipDetailForExternalTarget,
  unassignCharacterCampaign,
  updateRelationship,
} from "../queries/character-detail.query";

export function useCharacterDetailScreen(session: ClientSession | null, characterId: string) {
  const queryClient = useQueryClient();
  const detailQueryKey = [
    "characters",
    "detail",
    characterId,
    session?.accessToken ?? "no-session",
  ] as const;

  const detailQuery = useQuery({
    queryKey: detailQueryKey,
    enabled: Boolean(session),
    queryFn: async () => {
      if (!session) {
        throw new Error("Missing session");
      }
      return getCharacterDetailContext(session, characterId);
    },
  });

  const avatarPath = detailQuery.data?.character.avatar_path;
  const avatarQuery = useQuery({
    queryKey: [
      "characters",
      "detail",
      "avatar",
      characterId,
      avatarPath ?? "no-avatar",
      session?.accessToken ?? "no-session",
    ],
    enabled: Boolean(session && avatarPath),
    queryFn: async () => {
      if (!session || !avatarPath) {
        throw new Error("Missing avatar context");
      }
      const response = await getCharacterAvatarSignedUrl(session, avatarPath);
      return response.signedUrl;
    },
  });

  async function invalidateCharacterData() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: detailQueryKey }),
      queryClient.invalidateQueries({ queryKey: ["characters"] }),
      queryClient.invalidateQueries({ queryKey: ["campaigns"] }),
    ]);
  }

  const assignMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      if (!session) {
        throw new Error("Missing session");
      }
      return assignCharacterCampaign(session, characterId, campaignId);
    },
    onSuccess: invalidateCharacterData,
  });

  const unassignMutation = useMutation({
    mutationFn: async () => {
      if (!session) {
        throw new Error("Missing session");
      }
      return unassignCharacterCampaign(session, characterId);
    },
    onSuccess: invalidateCharacterData,
  });

  const createRelationshipMutation = useMutation({
    mutationFn: async (input: {
      sourceCharacterId: string;
      targetCharacterId?: string | null;
      targetSnapshotName?: string | null;
      categoryId: number;
      labelPresetId?: number | null;
      labelCustom?: string | null;
      description: string;
      firstTimelineEntry?: string;
    }) => {
      if (!session) {
        throw new Error("Missing session");
      }

      const created = await createRelationship(session, {
        sourceCharacterId: input.sourceCharacterId,
        targetCharacterId: input.targetCharacterId,
        targetSnapshotName: input.targetSnapshotName,
        categoryId: input.categoryId,
        labelPresetId: input.labelPresetId,
        labelCustom: input.labelCustom,
        description: input.description,
      });

      if (input.firstTimelineEntry?.trim()) {
        await addRelationshipTimelineEntry(
          session,
          created.relationshipId,
          input.firstTimelineEntry.trim(),
        );
      }

      return created;
    },
    onSuccess: invalidateCharacterData,
  });

  const updateRelationshipMutation = useMutation({
    mutationFn: async (input: {
      relationshipId: string;
      targetCharacterId?: string | null;
      targetSnapshotName?: string | null;
      categoryId: number;
      labelPresetId?: number | null;
      labelCustom?: string | null;
      description: string;
    }) => {
      if (!session) {
        throw new Error("Missing session");
      }

      return updateRelationship(session, input.relationshipId, {
        targetCharacterId: input.targetCharacterId,
        targetSnapshotName: input.targetSnapshotName,
        categoryId: input.categoryId,
        labelPresetId: input.labelPresetId,
        labelCustom: input.labelCustom,
        description: input.description,
      });
    },
    onSuccess: invalidateCharacterData,
  });

  const deleteRelationshipMutation = useMutation({
    mutationFn: async (relationshipId: string) => {
      if (!session) {
        throw new Error("Missing session");
      }
      return deleteRelationship(session, relationshipId);
    },
    onSuccess: invalidateCharacterData,
  });

  const relationshipDetailMutation = useMutation({
    mutationFn: async (input: {
      otherCharacterId?: string | null;
      outgoingRelationshipId?: string;
    }): Promise<RelationshipDetail> => {
      if (!session) {
        throw new Error("Missing session");
      }

      if (input.otherCharacterId) {
        return getCharacterRelationDetail(session, characterId, input.otherCharacterId);
      }

      if (!input.outgoingRelationshipId) {
        throw new Error("Missing relationship target");
      }

      const detail = await getRelationshipDetailForExternalTarget(
        session,
        input.outgoingRelationshipId,
      );

      return {
        outgoing: detail.outgoing,
        incoming: null,
        timeline: detail.timeline,
      };
    },
  });

  return {
    detailQuery,
    avatarQuery,
    assignMutation,
    unassignMutation,
    createRelationshipMutation,
    updateRelationshipMutation,
    deleteRelationshipMutation,
    relationshipDetailMutation,
    anyPending:
      assignMutation.isPending ||
      unassignMutation.isPending ||
      createRelationshipMutation.isPending ||
      updateRelationshipMutation.isPending ||
      deleteRelationshipMutation.isPending,
  };
}
