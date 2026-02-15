"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { setSession } from "@/lib/client/session";
import { useClientSession } from "@/lib/client/use-client-session";
import { getTranslator, type AppLocale } from "@/lib/i18n/index";
import { AppHeader } from "@/components/common/app-header";
import { loginUser } from "@/features/users/queries/users-auth.query";
import { getMe } from "@/features/users/queries/users-profile.query";
import type { LoginResponse, MeResponse } from "@/features/users/types";
import { appNavigationRoutes, appRoutes } from "@/app/router";

type HomeScreenProps = {
  locale: AppLocale;
  registrationEnabled: boolean;
  registeredNotice?: boolean;
};

const fieldClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";

export function HomePageView({
  locale,
  registrationEnabled,
  registeredNotice = false,
}: HomeScreenProps) {
  const t = useMemo(() => getTranslator(locale), [locale]);
  const { session, ready } = useClientSession();
  const router = useRouter();

  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(
    registeredNotice ? t("ui.feedback.registeredNowLogin") : "",
  );
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [me, setMe] = useState<MeResponse | null>(null);

  useEffect(() => {
    if (!session) {
      return;
    }

    void (async () => {
      try {
        const meResponse = await getMe(session);
        setMe(meResponse);
      } catch {
        return;
      }
    })();
  }, [session]);

  async function onLogin() {
    setBusy(true);
    setMessage("");
    try {
      const response: LoginResponse = await loginUser(loginForm);
      setSession({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        expiresAt: response.expiresAt,
      });
      router.replace("/");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("ui.feedback.requestFailed"));
    } finally {
      setBusy(false);
    }
  }

  if (!ready) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-3xl p-4" />
    );
  }

  if (!session) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_12%_20%,oklch(0.94_0.06_80),transparent_40%),radial-gradient(circle_at_90%_25%,oklch(0.93_0.04_185),transparent_35%)] px-4 py-12">
        <div className="mx-auto w-full max-w-md">
          <Card>
            <CardHeader>
              <CardTitle>{t("ui.start.loggedOutTitle")}</CardTitle>
              <CardDescription>{t("ui.start.loggedOutSubtitle")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <input
                className={fieldClass}
                type="email"
                placeholder={t("ui.fields.email")}
                value={loginForm.email}
                onChange={(event) =>
                  setLoginForm((prev) => ({ ...prev, email: event.target.value }))
                }
              />
              <input
                className={fieldClass}
                type="password"
                placeholder={t("ui.fields.password")}
                value={loginForm.password}
                onChange={(event) =>
                  setLoginForm((prev) => ({ ...prev, password: event.target.value }))
                }
              />
              {message ? (
                <div className="rounded-md border border-border bg-background p-2 text-xs">
                  {message}
                </div>
              ) : null}
            </CardContent>
            <CardFooter className="flex-col items-stretch gap-2">
              <Button disabled={busy} onClick={onLogin}>
                {t("ui.actions.login")}
              </Button>
              <div className="flex items-center justify-between text-xs">
                <Link href={appRoutes.passwordReset} className="underline">
                  {t("ui.nav.passwordReset")}
                </Link>
                {registrationEnabled ? (
                  <Link href={appRoutes.register} className="underline">
                    {t("ui.nav.register")}
                  </Link>
                ) : null}
              </div>
            </CardFooter>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(130deg,oklch(0.96_0.04_76),oklch(0.98_0.01_180)_40%,oklch(0.95_0.05_138))]">
      <AppHeader locale={locale} session={session} />
      <main className="mx-auto grid w-full max-w-7xl gap-4 px-4 py-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("ui.start.loggedInTitle")}</CardTitle>
            <CardDescription>{t("ui.start.loggedInSubtitle")}</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {me ? `${t("ui.start.welcome")}: ${me.profile.username}` : t("ui.start.loading")}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("ui.start.quickLinks")}</CardTitle>
            <CardDescription>{t("ui.start.quickLinksSubtitle")}</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            {appNavigationRoutes.map((route) => (
              <Button asChild key={route.href} variant="outline">
                <Link href={route.href}>{t(route.key)}</Link>
              </Button>
            ))}
            {me?.profile.role === "admin" ? (
              <Button asChild variant="outline">
                <Link href={appRoutes.admin}>{t("ui.menu.admin")}</Link>
              </Button>
            ) : null}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
