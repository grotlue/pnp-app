"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/common/empty-state";
import { FeedbackMessage } from "@/components/common/feedback-message";
import { SectionBox } from "@/components/common/section-box";
import { ToggleTabs } from "@/components/common/toggle-tabs";
import { TitleWithPrivacy } from "@/components/common/title-with-privacy";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AppHeader } from "@/components/common/app-header";
import { useClientSession } from "@/lib/client/use-client-session";
import { getTranslator, type AppLocale } from "@/lib/i18n/index";
import { getCampaignsQuery } from "@/features/campaigns/queries/get-campaigns.query";
import { getCharacters } from "@/features/characters/queries/characters-screen.query";
import { getPublicUserProfile } from "@/features/users/queries/users-public-profile.query";

type UserProfilePageViewProps = {
  locale: AppLocale;
  userId: string;
};

export function UserProfilePageView({ locale, userId }: UserProfilePageViewProps) {
  const t = useMemo(() => getTranslator(locale), [locale]);
  const router = useRouter();
  const { session, ready } = useClientSession();
  const [characterTab, setCharacterTab] = useState<"player" | "npc">("player");

  useEffect(() => {
    if (!ready) {
      return;
    }
    if (!session) {
      router.replace("/");
    }
  }, [ready, router, session]);

  const profileQuery = useQuery({
    queryKey: ["users", "public-profile", userId, session?.accessToken ?? "no-session"],
    enabled: Boolean(session),
    queryFn: async () => {
      if (!session) {
        throw new Error("Missing session");
      }

      const [profile, campaigns, characters] = await Promise.all([
        getPublicUserProfile(session, userId),
        getCampaignsQuery(session),
        getCharacters(session),
      ]);

      return {
        profile,
        campaigns: campaigns.filter((campaign) => campaign.owner_user_id === userId),
        characters: characters.filter((character) => character.owner_user_id === userId),
      };
    },
  });

  if (!ready || !session) {
    return <main className="min-h-screen" />;
  }

  if (profileQuery.isLoading) {
    return (
      <div className="min-h-screen bg-[linear-gradient(130deg,oklch(0.96_0.04_76),oklch(0.98_0.01_180)_40%,oklch(0.95_0.05_138))]">
        <AppHeader locale={locale} session={session} />
        <main className="mx-auto w-full max-w-4xl px-4 py-8">
          <Card>
            <CardContent className="py-8 text-sm text-muted-foreground">
              {t("ui.start.loading")}
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const profile = profileQuery.data;
  const errorMessage = profileQuery.error instanceof Error ? profileQuery.error.message : "";
  if (!profile) {
    return (
      <div className="min-h-screen bg-[linear-gradient(130deg,oklch(0.96_0.04_76),oklch(0.98_0.01_180)_40%,oklch(0.95_0.05_138))]">
        <AppHeader locale={locale} session={session} />
        <main className="mx-auto w-full max-w-4xl px-4 py-8">
          <Card>
            <CardContent className="py-8 text-sm text-muted-foreground">
              {errorMessage || t("ui.feedback.requestFailed")}
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(130deg,oklch(0.96_0.04_76),oklch(0.98_0.01_180)_40%,oklch(0.95_0.05_138))]">
      <AppHeader locale={locale} session={session} />
      <main className="mx-auto w-full max-w-4xl px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>{t("ui.userProfile.title")}</CardTitle>
            <CardDescription>{t("ui.userProfile.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <FeedbackMessage message={errorMessage} />
            <div>
              <strong>{t("ui.fields.username")}</strong>: {profile.profile.username}
            </div>
            <div>
              <strong>{t("ui.fields.description")}</strong>: {profile.profile.description || "-"}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <SectionBox title={t("ui.characters.title")}>
                <div className="mb-2">
                  <ToggleTabs
                    value={characterTab}
                    onChange={setCharacterTab}
                    options={[
                      { value: "player", label: t("ui.campaignDetail.playerCharacters") },
                      { value: "npc", label: t("ui.campaignDetail.npcs") },
                    ]}
                  />
                </div>
                <div className="space-y-1 text-xs">
                  {profile.characters
                    .filter((character) => character.type === characterTab)
                    .map((character) => (
                      <Link
                        key={character.id}
                        href={`/characters/${character.id}`}
                        className="flex items-center gap-1 underline-offset-2 hover:underline"
                      >
                        <TitleWithPrivacy title={character.name} isPrivate={character.is_private} />
                      </Link>
                    ))}
                  {profile.characters.filter((character) => character.type === characterTab).length === 0 ? (
                    <EmptyState
                      label={t("ui.feedback.empty")}
                      className="border-0 bg-transparent p-0 text-muted-foreground"
                    />
                  ) : null}
                </div>
              </SectionBox>
              <SectionBox title={t("ui.campaigns.title")}>
                <div className="space-y-1 text-xs">
                  {profile.campaigns.map((campaign) => (
                    <Link
                      key={campaign.id}
                      href={`/campaigns/${campaign.id}`}
                      className="flex items-center gap-1 underline-offset-2 hover:underline"
                    >
                      <TitleWithPrivacy title={campaign.title} isPrivate={campaign.is_private} />
                    </Link>
                  ))}
                  {profile.campaigns.length === 0 ? (
                    <EmptyState
                      label={t("ui.feedback.empty")}
                      className="border-0 bg-transparent p-0 text-muted-foreground"
                    />
                  ) : null}
                </div>
              </SectionBox>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
