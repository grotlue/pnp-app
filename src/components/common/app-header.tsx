"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bell, LogOut, Settings, Shield, User } from "lucide-react";
import { IconActionButton, IconActionLinkButton } from "@/components/common/icon-action-button";
import { clearLocaleCookie, readLocaleCookie, setLocaleCookie } from "@/lib/client/locale-cookie";
import { clearSession } from "@/lib/client/session";
import { getTranslator, resolveLocale, type AppLocale } from "@/lib/i18n/index";
import type { ClientSession } from "@/lib/client/session";
import { logoutUser } from "@/features/users/queries/users-auth.query";
import { useNotificationsUnreadCount } from "@/features/notifications/hooks/use-notifications-unread-count";
import { useMeQuery } from "@/features/users/hooks/use-me-query";
import type { MeResponse } from "@/features/users/types";
import { appNavigationRoutes, appRoutes } from "@/app/router";

type AppHeaderProps = {
  locale: AppLocale;
  session: ClientSession;
  me?: MeResponse | null;
  fetchMe?: boolean;
};

export function AppHeader({ locale, session, me: providedMe = null, fetchMe = true }: AppHeaderProps) {
  const t = getTranslator(locale);
  const pathname = usePathname();
  const router = useRouter();
  const currentPath = pathname ?? "";
  const meQuery = useMeQuery(session, { enabled: fetchMe });
  const me = providedMe ?? meQuery.data ?? null;
  const role = me?.profile.role;
  const roleResolved = me !== null || (fetchMe && meQuery.isSuccess);
  const profileLocale = me?.profile.locale;
  const notificationsUnreadCountQuery = useNotificationsUnreadCount(session);
  const unreadNotifications = notificationsUnreadCountQuery.data?.unreadCount ?? 0;

  useEffect(() => {
    if (!profileLocale) {
      return;
    }

    const normalizedProfileLocale = resolveLocale(profileLocale);
    const cookieLocale = readLocaleCookie();
    const cookieOutdated = cookieLocale !== normalizedProfileLocale;
    if (!cookieOutdated) {
      return;
    }

    setLocaleCookie(normalizedProfileLocale);
    if (normalizedProfileLocale !== locale) {
      router.refresh();
    }
  }, [locale, profileLocale, router]);

  async function onLogout() {
    try {
      await logoutUser(session);
    } catch {
      // Session cleanup below is the source of truth for client state.
    } finally {
      // Always clear local session even when backend sign-out fails.
      clearSession();
      clearLocaleCookie();
      router.replace("/");
      router.refresh();
    }
  }

  return (
    <header className="border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-2 px-4 py-3">
        <Link href={appRoutes.home} className="mr-2 font-semibold">
          pnp-app
        </Link>
        <nav className="flex flex-wrap items-center gap-2">
          {appNavigationRoutes.map((item) => {
            const active =
              currentPath === item.href || currentPath.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-md px-3 py-1.5 text-sm ${
                  active ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                }`}
              >
                {t(item.key)}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <IconActionLinkButton
            label={t("ui.menu.notifications")}
            icon={Bell}
            href={appRoutes.notifications}
            variant="ghost"
            badgeCount={unreadNotifications}
          />
          {roleResolved && role !== "admin" ? (
            <>
              <IconActionLinkButton
                label={t("ui.menu.profile")}
                icon={User}
                href={appRoutes.profile}
                variant="ghost"
              />
              <IconActionLinkButton
                label={t("ui.menu.settings")}
                icon={Settings}
                href={appRoutes.settings}
                variant="ghost"
              />
            </>
          ) : null}
          {roleResolved && role === "admin" ? (
            <>
              <IconActionLinkButton
                label={t("ui.menu.admin")}
                icon={Shield}
                href={appRoutes.admin}
                variant="ghost"
              />
              <IconActionLinkButton
                label={t("ui.menu.settings")}
                icon={Settings}
                href={appRoutes.settings}
                variant="ghost"
              />
            </>
          ) : null}
          <IconActionButton
            label={t("ui.actions.logout")}
            icon={LogOut}
            variant="ghost"
            onClick={onLogout}
          />
        </div>
      </div>
    </header>
  );
}
