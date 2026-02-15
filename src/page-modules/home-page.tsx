"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/common/empty-state";
import { FeedbackMessage } from "@/components/common/feedback-message";
import { FormInput } from "@/components/common/form-controls";
import { ToggleTabs } from "@/components/common/toggle-tabs";
import { TitleWithPrivacy } from "@/components/common/title-with-privacy";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { clearSession, setSession } from "@/lib/client/session";
import { useClientSession } from "@/lib/client/use-client-session";
import { getTranslator, type AppLocale } from "@/lib/i18n/index";
import { AppHeader } from "@/components/common/app-header";
import { getCampaignsQuery } from "@/features/campaigns/queries/get-campaigns.query";
import { getCharacters } from "@/features/characters/queries/characters-screen.query";
import { loginUser } from "@/features/users/queries/users-auth.query";
import { getMe } from "@/features/users/queries/users-profile.query";
import type { LoginResponse, MeResponse } from "@/features/users/types";
import { appRoutes } from "@/app/router";

type HomeScreenProps = {
  locale: AppLocale;
  registrationEnabled: boolean;
  registeredNotice?: boolean;
};

function isAuthSessionError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes("invalid or expired") ||
    message.includes("authorization bearer token is required")
  );
}

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
  const [characterTab, setCharacterTab] = useState<"player" | "npc">("player");

  const loggedInQuery = useQuery({
    queryKey: ["home", "logged-in", session?.accessToken ?? "no-session"],
    enabled: Boolean(session),
    queryFn: async () => {
      if (!session) {
        throw new Error("Missing session");
      }

      const [me, campaigns, characters] = await Promise.all([
        getMe(session),
        getCampaignsQuery(session),
        getCharacters(session),
      ]);

      return {
        me,
        campaigns,
        characters,
      };
    },
  });

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
              <FormInput
                type="email"
                placeholder={t("ui.fields.email")}
                value={loginForm.email}
                onChange={(event) =>
                  setLoginForm((prev) => ({ ...prev, email: event.target.value }))
                }
              />
              <FormInput
                type="password"
                placeholder={t("ui.fields.password")}
                value={loginForm.password}
                onChange={(event) =>
                  setLoginForm((prev) => ({ ...prev, password: event.target.value }))
                }
              />
              <FeedbackMessage message={message} />
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

  if (loggedInQuery.error && isAuthSessionError(loggedInQuery.error)) {
    clearSession();
    router.replace("/");
    router.refresh();
    return <main className="min-h-screen" />;
  }

  const data = loggedInQuery.data;
  const me: MeResponse | null = data?.me ?? null;
  const publicCampaigns = (data?.campaigns ?? []).filter((campaign) => !campaign.is_private);
  const publicCharacters = (data?.characters ?? []).filter((character) => !character.is_private);
  const visibleCharacters = publicCharacters.filter((character) => character.type === characterTab);

  return (
    <div className="min-h-screen bg-[linear-gradient(130deg,oklch(0.96_0.04_76),oklch(0.98_0.01_180)_40%,oklch(0.95_0.05_138))]">
      <AppHeader locale={locale} session={session} />
      <main className="mx-auto grid w-full max-w-7xl gap-4 px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>{t("ui.start.loggedInTitle")}</CardTitle>
            <CardDescription>{t("ui.start.loggedInSubtitle")}</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {me ? `${t("ui.start.welcome")}: ${me.profile.username}` : t("ui.start.loading")}
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{t("ui.characters.title")}</CardTitle>
              <CardDescription>{t("ui.campaignDetail.subtitle")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ToggleTabs
                value={characterTab}
                onChange={setCharacterTab}
                options={[
                  { value: "player", label: t("ui.campaignDetail.playerCharacters") },
                  { value: "npc", label: t("ui.campaignDetail.npcs") },
                ]}
              />
              <div className="space-y-1 text-xs">
                {visibleCharacters.map((character) => (
                  <Link
                    key={character.id}
                    href={`/characters/${character.id}`}
                    className="flex items-center gap-1 underline-offset-2 hover:underline"
                  >
                    <TitleWithPrivacy title={character.name} isPrivate={character.is_private} />
                  </Link>
                ))}
                {visibleCharacters.length === 0 ? (
                  <EmptyState
                    label={t("ui.feedback.empty")}
                    className="border-0 bg-transparent p-0 text-muted-foreground"
                  />
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("ui.campaigns.title")}</CardTitle>
              <CardDescription>{t("ui.campaigns.subtitle")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1 text-xs">
              {publicCampaigns.map((campaign) => (
                <Link
                  key={campaign.id}
                  href={`/campaigns/${campaign.id}`}
                  className="flex items-center gap-1 underline-offset-2 hover:underline"
                >
                  <TitleWithPrivacy title={campaign.title} isPrivate={campaign.is_private} />
                </Link>
              ))}
              {publicCampaigns.length === 0 ? (
                <EmptyState
                  label={t("ui.feedback.empty")}
                  className="border-0 bg-transparent p-0 text-muted-foreground"
                />
              ) : null}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
