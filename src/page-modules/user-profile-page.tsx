"use client";

import { UiDiv } from "@/components/ui/html-elements";
import { AppPageMain, PageViewport } from "@/components/ui/page-shell";
import { TextLink } from "@/components/ui/text-link";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/ui/empty-state";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { ListItemRow } from "@/components/ui/list-item-row";
import { PageLoadingState } from "@/components/ui/page-loading-state";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { SectionBox } from "@/components/ui/section-box";
import { ToggleTabs } from "@/components/ui/toggle-tabs";
import { TitleWithPrivacy } from "@/components/ui/title-with-privacy";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CampaignRoleBadge } from "@/features/campaigns/components/campaign-role-badge";
import { sortCampaigns } from "@/features/campaigns/logic/campaign-list.logic";
import { sortCharacters } from "@/features/characters/logic/character-list.logic";
import { useUserProfileScreenQuery } from "@/features/users/hooks/use-user-profile-screen-query";
import useClientSession from "@/lib/client/use-client-session";
import { type AppLocale, getTranslator } from "@/lib/i18n/index";
import { hasItems } from "@/lib/logic/collections";
import {
  clampListPage,
  DEFAULT_LIST_PAGE_SIZE,
  paginateListItems,
} from "@/lib/utils/list";

type UserProfilePageViewProps = {
  locale: AppLocale;
  userId: string;
};

const UserProfilePageView = ({ locale, userId }: UserProfilePageViewProps) => {
  const t = getTranslator(locale);
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

  const profileQuery = useUserProfileScreenQuery(session, userId);

  if (!ready || !session) {
    return <PageViewport />;
  }

  if (profileQuery.isLoading) {
    return (
      <AppPageMain maxWidth="4xl">
        <PageLoadingState label={t("ui.loading.page")} />
      </AppPageMain>
    );
  }

  const profile = profileQuery.data;
  const errorMessage =
    profileQuery.error instanceof Error ? profileQuery.error.message : "";
  if (!profile) {
    return (
      <AppPageMain maxWidth="4xl">
        <Card>
          <CardContent textStyle="muted-sm" paddingY={8}>
            {errorMessage || t("ui.feedback.requestFailed")}
          </CardContent>
        </Card>
      </AppPageMain>
    );
  }

  const visibleCharactersByType = profile.characters.filter(
    (character) => character.type === characterTab,
  );
  const searchedAndSortedCharacters = sortCharacters(
    visibleCharactersByType,
    "updated_desc",
  );
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

  const sortedCampaignEntries = sortCampaigns(
    profile.campaigns.map((entry) => entry.campaign),
    "updated_desc",
  );
  const roleByCampaignId = new Map(
    profile.campaigns.map((entry) => [entry.campaign.id, entry.role]),
  );
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
    <AppPageMain maxWidth="5xl">
      <Card>
        <CardHeader>
          <CardTitle>{t("ui.userProfile.title")}</CardTitle>
          <CardDescription>{t("ui.userProfile.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent stack={4} textStyle="sm">
          <FeedbackMessage message={errorMessage} />
          <UiDiv>
            <strong>{t("ui.fields.username")}</strong>:{" "}
            {profile.profile.username}
          </UiDiv>
          <UiDiv>
            <strong>{t("ui.fields.description")}</strong>:{" "}
            {profile.profile.description || "-"}
          </UiDiv>

          <UiDiv gridPreset="two-md">
            <SectionBox title={t("ui.characters.title")} stack={2}>
              <ToggleTabs
                value={characterTab}
                onChange={setCharacterTab}
                options={[
                  {
                    value: "player",
                    label: t("ui.labels.characterType.player"),
                  },
                  { value: "npc", label: t("ui.labels.characterType.npc") },
                ]}
              />

              <UiDiv stack={1}>
                {pagedCharacters.map((character) => (
                  <ListItemRow key={character.id}>
                    <UiDiv stack={1}>
                      <TextLink href={`/characters/${character.id}`}>
                        <TitleWithPrivacy
                          title={character.name}
                          isPrivate={character.is_private}
                        />
                      </TextLink>
                    </UiDiv>
                  </ListItemRow>
                ))}
                {!hasItems(searchedAndSortedCharacters) ? (
                  <EmptyState label={t("ui.feedback.empty")} variant="ghost" />
                ) : null}
              </UiDiv>

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

            <SectionBox title={t("ui.campaigns.title")} stack={2}>
              <UiDiv stack={1}>
                {pagedCampaigns.map((campaign) => {
                  const role = roleByCampaignId.get(campaign.id) ?? "player";

                  return (
                    <ListItemRow key={campaign.id}>
                      <UiDiv stack={1}>
                        <TextLink href={`/campaigns/${campaign.id}`}>
                          <TitleWithPrivacy
                            title={campaign.title}
                            isPrivate={campaign.is_private}
                          />
                        </TextLink>
                        <CampaignRoleBadge role={role} t={t} />
                      </UiDiv>
                    </ListItemRow>
                  );
                })}
                {!hasItems(sortedCampaignEntries) ? (
                  <EmptyState label={t("ui.feedback.empty")} variant="ghost" />
                ) : null}
              </UiDiv>

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
          </UiDiv>
        </CardContent>
      </Card>
    </AppPageMain>
  );
};

export default UserProfilePageView;
