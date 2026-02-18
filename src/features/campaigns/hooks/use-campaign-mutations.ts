"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ClientSession } from "@/lib/client/session";
import type { CampaignFormValues } from "../types";
import { queryKeys } from "@/lib/client/query-keys";
import { createCampaignMutation } from "../queries/create-campaign.mutation";
import { updateCampaignMutation } from "../queries/update-campaign.mutation";
import { deleteCampaignMutation } from "../queries/delete-campaign.mutation";

export function useCampaignMutations(session: ClientSession | null) {
  const queryClient = useQueryClient();

  async function invalidateCampaigns() {
    await queryClient.invalidateQueries({ queryKey: queryKeys.campaigns() });
  }

  const createMutation = useMutation({
    mutationFn: async (input: CampaignFormValues) => {
      if (!session) {
        throw new Error("Missing session");
      }
      return createCampaignMutation(session, input);
    },
    onSuccess: invalidateCampaigns,
  });

  const updateMutation = useMutation({
    mutationFn: async (input: {
      campaignId: string;
      values: CampaignFormValues;
    }) => {
      if (!session) {
        throw new Error("Missing session");
      }
      return updateCampaignMutation(session, input.campaignId, input.values);
    },
    onSuccess: invalidateCampaigns,
  });

  const deleteMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      if (!session) {
        throw new Error("Missing session");
      }
      return deleteCampaignMutation(session, campaignId);
    },
    onSuccess: invalidateCampaigns,
  });

  return {
    createMutation,
    updateMutation,
    deleteMutation,
    anyPending:
      createMutation.isPending ||
      updateMutation.isPending ||
      deleteMutation.isPending,
  };
}
