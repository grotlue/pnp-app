"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ClientSession } from "@/lib/client/session";
import {
  notificationsQueryKey,
  useNotificationsQuery,
} from "./use-notifications-query";
import { markNotificationReadMutation } from "@/features/notifications/queries/mark-notification-read.mutation";
import { markAllNotificationsReadMutation } from "@/features/notifications/queries/mark-all-notifications-read.mutation";
import { decideNotificationMembershipMutation } from "@/features/notifications/queries/decide-notification-membership.mutation";

export function useNotificationsScreen(session: ClientSession | null) {
  const queryClient = useQueryClient();
  const notificationsQuery = useNotificationsQuery(session);

  async function invalidateNotifications() {
    await queryClient.invalidateQueries({ queryKey: notificationsQueryKey });
  }

  const markReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      if (!session) {
        throw new Error("Missing session");
      }
      return markNotificationReadMutation(session, notificationId);
    },
    onSuccess: invalidateNotifications,
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      if (!session) {
        throw new Error("Missing session");
      }
      return markAllNotificationsReadMutation(session);
    },
    onSuccess: invalidateNotifications,
  });

  const decideMembershipMutation = useMutation({
    mutationFn: async (input: {
      campaignId: string;
      membershipId: string;
      state: "accepted" | "rejected";
    }) => {
      if (!session) {
        throw new Error("Missing session");
      }
      return decideNotificationMembershipMutation(session, input);
    },
    onSuccess: invalidateNotifications,
  });

  return {
    notificationsQuery,
    markReadMutation,
    markAllReadMutation,
    decideMembershipMutation,
    anyPending:
      markReadMutation.isPending ||
      markAllReadMutation.isPending ||
      decideMembershipMutation.isPending,
  };
}
