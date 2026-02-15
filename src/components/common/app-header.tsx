"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { clearSession } from "@/lib/client/session";
import { getTranslator, type AppLocale } from "@/lib/i18n/index";
import type { ClientSession } from "@/lib/client/session";
import { logoutUser } from "@/features/users/queries/users-auth.query";
import { appNavigationRoutes, appRoutes } from "@/app/router";

type AppHeaderProps = {
  locale: AppLocale;
  session: ClientSession;
};

export function AppHeader({ locale, session }: AppHeaderProps) {
  const t = getTranslator(locale);
  const pathname = usePathname();
  const router = useRouter();
  const currentPath = pathname ?? "";

  async function onLogout() {
    await logoutUser(session);
    clearSession();
    router.replace("/");
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
        <div className="ml-auto">
          <Button variant="destructive" size="sm" onClick={onLogout}>
            {t("ui.actions.logout")}
          </Button>
        </div>
      </div>
    </header>
  );
}
