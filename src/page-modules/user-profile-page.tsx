"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/common/empty-state";
import { FeedbackMessage } from "@/components/common/feedback-message";
import { ListItemRow } from "@/components/common/list-item-row";
import { PaginationControls } from "@/components/common/pagination-controls";
import { SectionBox } from "@/components/common/section-box";
import { ToggleTabs } from "@/components/common/toggle-tabs";
import { TitleWithPrivacy } from "@/components/common/title-with-privacy";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AppHeader } from "@/components/common/app-header";
import { CampaignRoleBadge } from "@/features/campaigns/components/campaign-role-badge";
import {
  sortCampaigns,
} from "@/features/campaigns/logic/campaign-list.logic";
import { getCampaignsQuery } from "@/features/campaigns/queries/get-campaigns.query";
import {
  sortCharacters,
} from "@/features/characters/logic/character-list.logic";
import { getCharacters } from "@/features/characters/queries/characters-screen.query";
import type { Campaign } from "@/features/campaigns/types";
import { getPublicUserProfile } from "@/features/users/queries/users-public-profile.query";
import { useClientSession } from "@/lib/client/use-client-session";
import { getTranslator, type AppLocale } from "@/lib/i18n/index";
import { textLinkClassName } from "@/lib/utils/link";
import { clampListPage, DEFAULT_LIST_PAGE_SIZE, paginateListItems } from "@/lib/utils/list";

type UserProfilePageViewProps = {
  locale: AppLocale;
  userId: string;
};

type ProfileCampaignEntry = {
  campaign: Campaign;
  role: "owner" | "player";
};

export function UserProfilePageView({ locale, userId }: UserProfilePageViewProps) {
  const t = useMemo(() => getTranslator(locale), [locale]);
  const router = useRouter();
  const { session, ready } = useClientSession();
  const [characterTab, setCharacterTab] = useState<"player" | "npc">("player");
  const [characterPage, setCharacterPage] = useState(1);
  const [campaignPage, setCampaignPage] = useState(1);

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
        getCampaignsQuery(session, { roleForUserId: userId }),
        getCharacters(session),
      ]);
      const profileCampaigns: ProfileCampaignEntry[] = campaigns
        .filter((campaign) => campaign.role_for_user === "owner" || campaign.role_for_user === "player")
        .map((campaign) => ({
          campaign,
          role: campaign.role_for_user === "owner" ? "owner" : "player",
        }));

      return {
        profile,
        campaigns: profileCampaigns,
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

  const visibleCharactersByType = profile.characters.filter(
    (character) => character.type === characterTab,
  );
  const searchedAndSortedCharacters = sortCharacters(visibleCharactersByType, "updated_desc");
  const safeCharacterPage = clampListPage(
    characterPage,
    searchedAndSortedCharacters.length,
    DEFAULT_LIST_PAGE_SIZE,
  );
  const pagedCharacters = paginateListItems(
    searchedAndSortedCharacters,
    safeCharacterPage,
    DEFAULT_LIST_PAGE_SIZE,
  );

  const sortedCampaignEntries = sortCampaigns(profile.campaigns.map((entry) => entry.campaign), "updated_desc");
  const roleByCampaignId = new Map(profile.campaigns.map((entry) => [entry.campaign.id, entry.role]));
  const safeCampaignPage = clampListPage(
    campaignPage,
    sortedCampaignEntries.length,
    DEFAULT_LIST_PAGE_SIZE,
  );
  const pagedCampaigns = paginateListItems(
    sortedCampaignEntries,
    safeCampaignPage,
    DEFAULT_LIST_PAGE_SIZE,
  );

  return (
    <div className="min-h-screen bg-[linear-gradient(130deg,oklch(0.96_0.04_76),oklch(0.98_0.01_180)_40%,oklch(0.95_0.05_138))]">
      <AppHeader locale={locale} session={session} />
      <main className="mx-auto w-full max-w-5xl px-4 py-8">
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
              <SectionBox title={t("ui.characters.title")} className="space-y-2">
                <ToggleTabs
                  value={characterTab}
                  onChange={setCharacterTab}
                  options={[
                    { value: "player", label: t("ui.labels.characterType.player") },
                    { value: "npc", label: t("ui.labels.characterType.npc") },
                  ]}
                />

                <div className="space-y-1">
                  {pagedCharacters.map((character) => (
                    <ListItemRow key={character.id}>
                      <div className="space-y-1">
                        <Link href={`/characters/${character.id}`} className={textLinkClassName}>
                          <TitleWithPrivacy title={character.name} isPrivate={character.is_private} />
                        </Link>
                      </div>
                    </ListItemRow>
                  ))}
                  {searchedAndSortedCharacters.length === 0 ? (
                    <EmptyState
                      label={t("ui.feedback.empty")}
                      className="border-0 bg-transparent p-0 text-muted-foreground"
                    />
                  ) : null}
                </div>

                <PaginationControls
                  page={safeCharacterPage}
                  pageSize={DEFAULT_LIST_PAGE_SIZE}
                  totalItems={searchedAndSortedCharacters.length}
                  previousLabel={t("ui.list.previous")}
                  nextLabel={t("ui.list.next")}
                  pageLabel={t("ui.list.page")}
                  onPageChange={setCharacterPage}
                />
              </SectionBox>

              <SectionBox title={t("ui.campaigns.title")} className="space-y-2">
                <div className="space-y-1">
                  {pagedCampaigns.map((campaign) => {
                    const role = roleByCampaignId.get(campaign.id) ?? "player";

                    return (
                      <ListItemRow key={campaign.id}>
                        <div className="space-y-1">
                          <Link href={`/campaigns/${campaign.id}`} className={textLinkClassName}>
                            <TitleWithPrivacy title={campaign.title} isPrivate={campaign.is_private} />
                          </Link>
                          <CampaignRoleBadge role={role} t={t} />
                        </div>
                      </ListItemRow>
                    );
                  })}
                  {sortedCampaignEntries.length === 0 ? (
                    <EmptyState
                      label={t("ui.feedback.empty")}
                      className="border-0 bg-transparent p-0 text-muted-foreground"
                    />
                  ) : null}
                </div>

                <PaginationControls
                  page={safeCampaignPage}
                  pageSize={DEFAULT_LIST_PAGE_SIZE}
                  totalItems={sortedCampaignEntries.length}
                  previousLabel={t("ui.list.previous")}
                  nextLabel={t("ui.list.next")}
                  pageLabel={t("ui.list.page")}
                  onPageChange={setCampaignPage}
                />
              </SectionBox>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
