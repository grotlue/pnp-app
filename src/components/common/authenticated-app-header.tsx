"use client";

import { AppHeader } from "@/components/common/app-header";
import { readLocaleCookie } from "@/lib/client/locale-cookie";
import { useClientSession } from "@/lib/client/use-client-session";
import { resolveLocale } from "@/lib/i18n";

export function AuthenticatedAppHeader() {
  const { session, ready } = useClientSession();
  const locale = resolveLocale(readLocaleCookie());

  if (!ready || !session) {
    return null;
  }

  return <AppHeader locale={locale} session={session} />;
}
