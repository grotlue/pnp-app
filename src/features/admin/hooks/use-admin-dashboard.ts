"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getMe } from "@/features/users/queries/users-profile.query";
import type { ClientSession } from "@/lib/client/session";
import type {
  AdminCreateCampaignInput,
  AdminCreateCharacterInput,
  AdminCreateUserInput,
  AdminUpdateCampaignInput,
  AdminUpdateCharacterInput,
  AdminUpdateUserInput,
} from "../types";
import {
  createAdminCampaign,
  deleteAdminCampaign,
  listAdminCampaigns,
  updateAdminCampaign,
} from "../queries/admin-campaigns.query";
import {
  createAdminCharacter,
  deleteAdminCharacter,
  listAdminCharacters,
  updateAdminCharacter,
} from "../queries/admin-characters.query";
import {
  createAdminUser,
  deleteAdminUser,
  listAdminUsers,
  updateAdminUser,
} from "../queries/admin-users.query";

export function useAdminDashboard(session: ClientSession | null) {
  const queryClient = useQueryClient();
  const tokenKey = session?.accessToken ?? "no-session";

  const meQuery = useQuery({
    queryKey: ["admin", "me", tokenKey],
    enabled: Boolean(session),
    queryFn: async () => {
      if (!session) {
        throw new Error("Missing session");
      }
      return getMe(session);
    },
  });

  const isAdmin = meQuery.data?.profile.role === "admin";

  const usersQuery = useQuery({
    queryKey: ["admin", "users", tokenKey],
    enabled: Boolean(session && isAdmin),
    queryFn: async () => {
      if (!session) {
        throw new Error("Missing session");
      }
      return listAdminUsers(session);
    },
  });

  const campaignsQuery = useQuery({
    queryKey: ["admin", "campaigns", tokenKey],
    enabled: Boolean(session && isAdmin),
    queryFn: async () => {
      if (!session) {
        throw new Error("Missing session");
      }
      return listAdminCampaigns(session);
    },
  });

  const charactersQuery = useQuery({
    queryKey: ["admin", "characters", tokenKey],
    enabled: Boolean(session && isAdmin),
    queryFn: async () => {
      if (!session) {
        throw new Error("Missing session");
      }
      return listAdminCharacters(session);
    },
  });

  async function invalidateUsers() {
    await queryClient.invalidateQueries({ queryKey: ["admin", "users", tokenKey] });
  }

  async function invalidateCampaigns() {
    await queryClient.invalidateQueries({ queryKey: ["admin", "campaigns", tokenKey] });
  }

  async function invalidateCharacters() {
    await queryClient.invalidateQueries({ queryKey: ["admin", "characters", tokenKey] });
  }

  const createUserMutation = useMutation({
    mutationFn: async (input: AdminCreateUserInput) => {
      if (!session) {
        throw new Error("Missing session");
      }
      return createAdminUser(session, input);
    },
    onSuccess: invalidateUsers,
  });

  const updateUserMutation = useMutation({
    mutationFn: async (input: { userId: string; values: AdminUpdateUserInput }) => {
      if (!session) {
        throw new Error("Missing session");
      }
      return updateAdminUser(session, input.userId, input.values);
    },
    onSuccess: invalidateUsers,
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      if (!session) {
        throw new Error("Missing session");
      }
      return deleteAdminUser(session, userId);
    },
    onSuccess: async () => {
      await invalidateUsers();
      await queryClient.invalidateQueries({ queryKey: ["admin", "me", tokenKey] });
    },
  });

  const createCampaignMutation = useMutation({
    mutationFn: async (input: AdminCreateCampaignInput) => {
      if (!session) {
        throw new Error("Missing session");
      }
      return createAdminCampaign(session, input);
    },
    onSuccess: invalidateCampaigns,
  });

  const updateCampaignMutation = useMutation({
    mutationFn: async (input: { campaignId: string; values: AdminUpdateCampaignInput }) => {
      if (!session) {
        throw new Error("Missing session");
      }
      return updateAdminCampaign(session, input.campaignId, input.values);
    },
    onSuccess: invalidateCampaigns,
  });

  const deleteCampaignMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      if (!session) {
        throw new Error("Missing session");
      }
      return deleteAdminCampaign(session, campaignId);
    },
    onSuccess: invalidateCampaigns,
  });

  const createCharacterMutation = useMutation({
    mutationFn: async (input: AdminCreateCharacterInput) => {
      if (!session) {
        throw new Error("Missing session");
      }
      return createAdminCharacter(session, input);
    },
    onSuccess: invalidateCharacters,
  });

  const updateCharacterMutation = useMutation({
    mutationFn: async (input: { characterId: string; values: AdminUpdateCharacterInput }) => {
      if (!session) {
        throw new Error("Missing session");
      }
      return updateAdminCharacter(session, input.characterId, input.values);
    },
    onSuccess: invalidateCharacters,
  });

  const deleteCharacterMutation = useMutation({
    mutationFn: async (characterId: string) => {
      if (!session) {
        throw new Error("Missing session");
      }
      return deleteAdminCharacter(session, characterId);
    },
    onSuccess: invalidateCharacters,
  });

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
}
