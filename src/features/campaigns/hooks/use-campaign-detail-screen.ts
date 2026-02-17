"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ClientSession } from "@/lib/client/session";
import {
  assignCharacterToCampaign,
  decideCampaignMembership,
  deleteCampaignDetail,
  getCampaignDetailContext,
  inviteUserToCampaign,
  requestJoinCampaign,
  updateCampaignDetail,
} from "../queries/campaign-detail.query";

export function useCampaignDetailScreen(
  session: ClientSession | null,
  campaignId: string,
) {
  const queryClient = useQueryClient();
  const queryKey = [
    "campaigns",
    "detail",
    campaignId,
    session?.accessToken ?? "no-session",
  ] as const;

  const detailQuery = useQuery({
    queryKey,
    enabled: Boolean(session),
    queryFn: async () => {
      if (!session) {
        throw new Error("Missing session");
      }
      return getCampaignDetailContext(session, campaignId);
    },
  });

  async function invalidate() {
    await queryClient.invalidateQueries({ queryKey });
  }

  const decideMutation = useMutation({
    mutationFn: async (input: {
      membershipId: string;
      state: "accepted" | "rejected";
    }) => {
      if (!session) {
        throw new Error("Missing session");
      }
      return decideCampaignMembership(
        session,
        campaignId,
        input.membershipId,
        input.state,
      );
    },
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: async (input: {
      title: string;
      description: string;
      isPrivate?: boolean;
    }) => {
      if (!session) {
        throw new Error("Missing session");
      }
      return updateCampaignDetail(session, campaignId, input);
    },
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!session) {
        throw new Error("Missing session");
      }
      return deleteCampaignDetail(session, campaignId);
    },
  });

  const inviteMutation = useMutation({
    mutationFn: async (userId: string) => {
      if (!session) {
        throw new Error("Missing session");
      }
      return inviteUserToCampaign(session, campaignId, userId);
    },
    onSuccess: invalidate,
  });

  const assignMutation = useMutation({
    mutationFn: async (characterId: string) => {
      if (!session) {
        throw new Error("Missing session");
      }
      return assignCharacterToCampaign(session, characterId, campaignId);
    },
    onSuccess: invalidate,
  });

  const joinMutation = useMutation({
    mutationFn: async () => {
      if (!session) {
        throw new Error("Missing session");
      }
      return requestJoinCampaign(session, campaignId);
    },
    onSuccess: invalidate,
  });

  return {
    detailQuery,
    decideMutation,
    updateMutation,
    deleteMutation,
    inviteMutation,
    assignMutation,
    joinMutation,
    anyPending:
      decideMutation.isPending ||
      updateMutation.isPending ||
      deleteMutation.isPending ||
      inviteMutation.isPending ||
      assignMutation.isPending ||
      joinMutation.isPending,
  };
}
