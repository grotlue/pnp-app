"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/client/query-keys";
import type { ClientSession } from "@/lib/client/session";
import type {
  AdminCreateCampaignInput,
  AdminCreateCharacterInput,
  AdminCreateUserInput,
  AdminUpdateCampaignInput,
  AdminUpdateCharacterInput,
  AdminUpdateUserInput,
} from "../types";
import { getAdminBootstrap } from "../queries/admin-bootstrap.query";
import {
  createAdminCampaign,
  deleteAdminCampaign,
  updateAdminCampaign,
} from "../queries/admin-campaigns.query";
import {
  createAdminCharacter,
  deleteAdminCharacter,
  updateAdminCharacter,
} from "../queries/admin-characters.query";
import {
  createAdminUser,
  deleteAdminUser,
  updateAdminUser,
} from "../queries/admin-users.query";

const useAdminDashboard = (session: ClientSession | null) => {
  const queryClient = useQueryClient();
  const tokenKey = session?.accessToken ?? "no-session";
  const bootstrapQuery = useQuery({
    queryKey: queryKeys.adminBootstrap(tokenKey),
    enabled: Boolean(session),
    staleTime: 30_000,
    retry: false,
    queryFn: async () => {
      if (!session) {
        throw new Error("Missing session");
      }
      return getAdminBootstrap(session);
    },
  });

  const invalidateBootstrap = async () => {
    await queryClient.invalidateQueries({
      queryKey: queryKeys.adminBootstrap(tokenKey),
    });
  };

  const createUserMutation = useMutation({
    mutationFn: async (input: AdminCreateUserInput) => {
      if (!session) {
        throw new Error("Missing session");
      }
      return createAdminUser(session, input);
    },
    onSuccess: invalidateBootstrap,
  });

  const updateUserMutation = useMutation({
    mutationFn: async (input: {
      userId: string;
      values: AdminUpdateUserInput;
    }) => {
      if (!session) {
        throw new Error("Missing session");
      }
      return updateAdminUser(session, input.userId, input.values);
    },
    onSuccess: invalidateBootstrap,
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      if (!session) {
        throw new Error("Missing session");
      }
      return deleteAdminUser(session, userId);
    },
    onSuccess: invalidateBootstrap,
  });

  const createCampaignMutation = useMutation({
    mutationFn: async (input: AdminCreateCampaignInput) => {
      if (!session) {
        throw new Error("Missing session");
      }
      return createAdminCampaign(session, input);
    },
    onSuccess: invalidateBootstrap,
  });

  const updateCampaignMutation = useMutation({
    mutationFn: async (input: {
      campaignId: string;
      values: AdminUpdateCampaignInput;
    }) => {
      if (!session) {
        throw new Error("Missing session");
      }
      return updateAdminCampaign(session, input.campaignId, input.values);
    },
    onSuccess: invalidateBootstrap,
  });

  const deleteCampaignMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      if (!session) {
        throw new Error("Missing session");
      }
      return deleteAdminCampaign(session, campaignId);
    },
    onSuccess: invalidateBootstrap,
  });

  const createCharacterMutation = useMutation({
    mutationFn: async (input: AdminCreateCharacterInput) => {
      if (!session) {
        throw new Error("Missing session");
      }
      return createAdminCharacter(session, input);
    },
    onSuccess: invalidateBootstrap,
  });

  const updateCharacterMutation = useMutation({
    mutationFn: async (input: {
      characterId: string;
      values: AdminUpdateCharacterInput;
    }) => {
      if (!session) {
        throw new Error("Missing session");
      }
      return updateAdminCharacter(session, input.characterId, input.values);
    },
    onSuccess: invalidateBootstrap,
  });

  const deleteCharacterMutation = useMutation({
    mutationFn: async (characterId: string) => {
      if (!session) {
        throw new Error("Missing session");
      }
      return deleteAdminCharacter(session, characterId);
    },
    onSuccess: invalidateBootstrap,
  });

  const meQuery = {
    data: bootstrapQuery.data?.me,
    error: bootstrapQuery.error,
    isLoading: bootstrapQuery.isLoading,
  };

  const usersQuery = {
    data: bootstrapQuery.data?.users,
    error: bootstrapQuery.error,
    isLoading: bootstrapQuery.isLoading,
  };

  const campaignsQuery = {
    data: bootstrapQuery.data?.campaigns,
    error: bootstrapQuery.error,
    isLoading: bootstrapQuery.isLoading,
  };

  const charactersQuery = {
    data: bootstrapQuery.data?.characters,
    error: bootstrapQuery.error,
    isLoading: bootstrapQuery.isLoading,
  };

  return {
    meQuery,
    usersQuery,
    campaignsQuery,
    charactersQuery,
    createUserMutation,
    updateUserMutation,
    deleteUserMutation,
    createCampaignMutation,
    updateCampaignMutation,
    deleteCampaignMutation,
    createCharacterMutation,
    updateCharacterMutation,
    deleteCharacterMutation,
    anyPending:
      createUserMutation.isPending ||
      updateUserMutation.isPending ||
      deleteUserMutation.isPending ||
      createCampaignMutation.isPending ||
      updateCampaignMutation.isPending ||
      deleteCampaignMutation.isPending ||
      createCharacterMutation.isPending ||
      updateCharacterMutation.isPending ||
      deleteCharacterMutation.isPending,
  };
};

export { useAdminDashboard as default, useAdminDashboard };
