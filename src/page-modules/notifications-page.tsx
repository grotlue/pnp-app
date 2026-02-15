"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/common/app-header";
import { EmptyState } from "@/components/common/empty-state";
import { FeedbackMessage } from "@/components/common/feedback-message";
import { ListItemRow } from "@/components/common/list-item-row";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNotificationsScreen } from "@/features/notifications/hooks/use-notifications-screen";
import {
  getNotificationDisplayTitle,
  getNotificationEventLabel,
  getNotificationMembershipTarget,
  getNotificationUnreadCount,
  getNotificationViewPath,
} from "@/features/notifications/logic/notification-list.logic";
import type { NotificationEntry } from "@/features/notifications/types";
import { useClientSession } from "@/lib/client/use-client-session";
import { getTranslator, type AppLocale } from "@/lib/i18n/index";

type NotificationsPageViewProps = {
  locale: AppLocale;
};

function formatNotificationTimestamp(value: string, locale: AppLocale) {
  const date = new Date(value);
  const localeTag = locale === "de" ? "de-DE" : "en-US";
  return new Intl.DateTimeFormat(localeTag, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function notificationTone(notification: NotificationEntry) {
  if (notification.event_type === "campaign_invite") {
    return "blue" as const;
  }
  if (notification.event_type === "campaign_join_request") {
    return "amber" as const;
  }
  if (notification.event_type === "relationship_created") {
    return "green" as const;
  }
  return "teal" as const;
}

export function NotificationsPageView({ locale }: NotificationsPageViewProps) {
  const t = useMemo(() => getTranslator(locale), [locale]);
  const router = useRouter();
  const { session, ready } = useClientSession();
  const autoReadTriggered = useRef(false);

  const { notificationsQuery, markReadMutation, markAllReadMutation, decideMembershipMutation, anyPending } =
    useNotificationsScreen(session);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!ready) {
      return;
    }
    if (!session) {
      router.replace("/");
    }
  }, [ready, router, session]);

  const notifications = notificationsQuery.data ?? [];
  const unreadCount = getNotificationUnreadCount(notifications);

  useEffect(() => {
    if (!session || notificationsQuery.isLoading || notifications.length === 0 || unreadCount === 0) {
      if (unreadCount === 0) {
        autoReadTriggered.current = false;
      }
      return;
    }
    if (autoReadTriggered.current || markAllReadMutation.isPending) {
      return;
    }

    autoReadTriggered.current = true;
    void markAllReadMutation.mutateAsync().catch(() => {
      setMessage(t("ui.feedback.requestFailed"));
      autoReadTriggered.current = false;
    });
  }, [
    markAllReadMutation,
    notifications.length,
    notificationsQuery.isLoading,
    session,
    t,
    unreadCount,
  ]);

  async function markAsRead(notification: NotificationEntry) {
    if (notification.is_read) {
      return;
    }
    await markReadMutation.mutateAsync(notification.id);
  }

  async function onView(notification: NotificationEntry) {
    const path = getNotificationViewPath(notification);
    if (!path) {
      return;
    }

    setMessage("");
    try {
      await markAsRead(notification);
      router.push(path);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("ui.feedback.requestFailed"));
    }
  }

  async function onDecide(
    notification: NotificationEntry,
    state: "accepted" | "rejected",
  ) {
    const target = getNotificationMembershipTarget(notification);
    if (!target) {
      setMessage(t("ui.feedback.requestFailed"));
      return;
    }

    setMessage("");
    try {
      await decideMembershipMutation.mutateAsync({
        campaignId: target.campaignId,
        membershipId: target.membershipId,
        state,
      });
      await markAsRead(notification);
      setMessage(t("ui.feedback.saved"));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("ui.feedback.requestFailed"));
    }
  }

  if (!ready || !session) {
    return <main className="min-h-screen" />;
  }

  const queryError = notificationsQuery.error instanceof Error ? notificationsQuery.error.message : "";
  const feedback = message || queryError;

  return (
    <div className="min-h-screen bg-[linear-gradient(130deg,oklch(0.96_0.04_76),oklch(0.98_0.01_180)_40%,oklch(0.95_0.05_138))]">
      <AppHeader locale={locale} session={session} />
      <main className="mx-auto w-full max-w-5xl px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>{t("ui.notifications.title")}</CardTitle>
            <CardDescription>{t("ui.notifications.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <StatusBadge label={t("ui.notifications.unread", "Unread")} tone="violet" />
              <span>{unreadCount}</span>
              <Button
                variant="outline"
                size="sm"
                disabled={anyPending || unreadCount === 0}
                onClick={async () => {
                  setMessage("");
                  try {
                    await markAllReadMutation.mutateAsync();
                    setMessage(t("ui.feedback.saved"));
                  } catch (error) {
                    setMessage(
                      error instanceof Error ? error.message : t("ui.feedback.requestFailed"),
                    );
                  }
                }}
              >
                {t("ui.notifications.markAllRead")}
              </Button>
            </div>

            <FeedbackMessage message={feedback} />

            {notificationsQuery.isLoading ? (
              <div className="rounded-lg border border-border bg-background/70 p-3 text-xs text-muted-foreground">
                {t("ui.start.loading")}
              </div>
            ) : notifications.length === 0 ? (
              <EmptyState label={t("ui.feedback.empty")} />
            ) : (
              <div className="space-y-2">
                {notifications.map((notification) => {
                  const viewPath = getNotificationViewPath(notification);
                  const canDecideMembership =
                    notification.event_type === "campaign_invite" ||
                    notification.event_type === "campaign_join_request";
                  const eventLabel = getNotificationEventLabel(notification, t);
                  const title = getNotificationDisplayTitle(notification, t);

                  return (
                    <ListItemRow
                      key={notification.id}
                      className={notification.is_read ? "opacity-80" : ""}
                      actions={
                        <>
                          {canDecideMembership ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={anyPending}
                              onClick={() => void onDecide(notification, "accepted")}
                            >
                              {t("ui.actions.accept")}
                            </Button>
                          ) : null}
                          {canDecideMembership ? (
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={anyPending}
                              onClick={() => void onDecide(notification, "rejected")}
                            >
                              {t("ui.actions.reject")}
                            </Button>
                          ) : null}
                          {viewPath ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={anyPending}
                              onClick={() => void onView(notification)}
                            >
                              {t("ui.actions.view")}
                            </Button>
                          ) : null}
                          {!notification.is_read ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={anyPending}
                              onClick={() =>
                                void (async () => {
                                  setMessage("");
                                  try {
                                    await markAsRead(notification);
                                  } catch (error) {
                                    setMessage(
                                      error instanceof Error
                                        ? error.message
                                        : t("ui.feedback.requestFailed"),
                                    );
                                  }
                                })()
                              }
                            >
                              {t("ui.notifications.markRead")}
                            </Button>
                          ) : null}
                        </>
                      }
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-sm font-medium">{title}</div>
                          <StatusBadge label={eventLabel} tone={notificationTone(notification)} />
                          {!notification.is_read ? (
                            <StatusBadge label={t("ui.notifications.unread")} tone="violet" />
                          ) : null}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatNotificationTimestamp(notification.created_at, locale)}
                        </div>
                      </div>
                    </ListItemRow>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
