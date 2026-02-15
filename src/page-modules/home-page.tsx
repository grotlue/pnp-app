"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/common/empty-state";
import { FeedbackMessage } from "@/components/common/feedback-message";
import { FormInput } from "@/components/common/form-controls";
import { ListControls } from "@/components/common/list-controls";
import { ListItemRow } from "@/components/common/list-item-row";
import { OwnershipBadge } from "@/components/common/ownership-badge";
import { PaginationControls } from "@/components/common/pagination-controls";
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
import { appRoutes } from "@/app/router";
import { AppHeader } from "@/components/common/app-header";
import { CampaignRoleBadge } from "@/features/campaigns/components/campaign-role-badge";
import {
  type CampaignListSort,
  searchCampaigns,
  sortCampaigns,
} from "@/features/campaigns/logic/campaign-list.logic";
import { getCampaignsQuery } from "@/features/campaigns/queries/get-campaigns.query";
import {
  type CharacterListSort,
  type CharacterOwnershipFilter,
  filterCharactersByOwnership,
  searchCharacters,
  sortCharacters,
} from "@/features/characters/logic/character-list.logic";
import { getCharacters } from "@/features/characters/queries/characters-screen.query";
import { loginUser } from "@/features/users/queries/users-auth.query";
import { getMe } from "@/features/users/queries/users-profile.query";
import type { LoginResponse, MeResponse } from "@/features/users/types";
import { setLocaleCookie } from "@/lib/client/locale-cookie";
import { clearSession, setSession } from "@/lib/client/session";
import { useClientSession } from "@/lib/client/use-client-session";
import { getTranslator, resolveLocale, type AppLocale } from "@/lib/i18n/index";
import { textLinkClassName } from "@/lib/utils/link";
import { clampListPage, DEFAULT_LIST_PAGE_SIZE, paginateListItems } from "@/lib/utils/list";

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
  const [characterOwnershipFilter, setCharacterOwnershipFilter] =
    useState<CharacterOwnershipFilter>("all");
  const [characterSearchQuery, setCharacterSearchQuery] = useState("");
  const [characterSortBy, setCharacterSortBy] = useState<CharacterListSort>("updated_desc");
  const [characterPage, setCharacterPage] = useState(1);

  const [campaignSearchQuery, setCampaignSearchQuery] = useState("");
  const [campaignSortBy, setCampaignSortBy] = useState<CampaignListSort>("updated_desc");
  const [campaignPage, setCampaignPage] = useState(1);

  const loggedInQuery = useQuery({
    queryKey: ["home", "logged-in", session?.accessToken ?? "no-session"],
    enabled: Boolean(session),
    queryFn: async () => {
      if (!session) {
        throw new Error("Missing session");
      }

      const [me, campaigns, characters] = await Promise.all([
        getMe(session),
        getCampaignsQuery(session, { scope: "public" }),
        getCharacters(session, { scope: "public" }),
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
      if (response.locale) {
        setLocaleCookie(resolveLocale(response.locale));
      }
      router.replace("/");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("ui.feedback.requestFailed"));
    } finally {
      setBusy(false);
    }
  }

  if (!ready) {
    return <main className="mx-auto min-h-screen w-full max-w-3xl p-4" />;
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
                <Link href={appRoutes.passwordReset} className={textLinkClassName}>
                  {t("ui.nav.passwordReset")}
                </Link>
                {registrationEnabled ? (
                  <Link href={appRoutes.register} className={textLinkClassName}>
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
  const currentUserId = me?.user.id;
  const publicCampaigns = data?.campaigns ?? [];
  const publicCharacters = data?.characters ?? [];
  const campaignById = new Map(publicCampaigns.map((campaign) => [campaign.id, campaign]));

  const visibleCharactersByType = publicCharacters.filter(
    (character) => character.type === characterTab,
  );
  const filteredCharacters = filterCharactersByOwnership(
    visibleCharactersByType,
    characterOwnershipFilter,
    currentUserId,
  );
  const searchedAndSortedCharacters = sortCharacters(
    searchCharacters(filteredCharacters, characterSearchQuery),
    characterSortBy,
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

  const searchedAndSortedCampaigns = sortCampaigns(
    searchCampaigns(publicCampaigns, campaignSearchQuery),
    campaignSortBy,
  );
  const safeCampaignPage = clampListPage(
    campaignPage,
    searchedAndSortedCampaigns.length,
    DEFAULT_LIST_PAGE_SIZE,
  );
  const pagedCampaigns = paginateListItems(
    searchedAndSortedCampaigns,
    safeCampaignPage,
    DEFAULT_LIST_PAGE_SIZE,
  );

  const characterSortOptions = [
    { value: "updated_desc", label: t("ui.list.sortUpdated") },
    { value: "created_desc", label: t("ui.list.sortCreated") },
    { value: "name_asc", label: t("ui.list.sortName") },
  ];
  const campaignSortOptions = [
    { value: "updated_desc", label: t("ui.list.sortUpdated") },
    { value: "created_desc", label: t("ui.list.sortCreated") },
    { value: "name_asc", label: t("ui.list.sortName") },
  ];

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
            </CardHeader>
            <CardContent className="space-y-3">
              <ToggleTabs
                value={characterTab}
                onChange={setCharacterTab}
                options={[
                  { value: "player", label: t("ui.labels.characterType.player") },
                  { value: "npc", label: t("ui.labels.characterType.npc") },
                ]}
              />
              <ListControls
                searchValue={characterSearchQuery}
                onSearchChange={setCharacterSearchQuery}
                searchPlaceholder={t("ui.list.searchCharacters")}
                sortValue={characterSortBy}
                onSortChange={(value) => setCharacterSortBy(value as CharacterListSort)}
                sortLabel={t("ui.list.sortBy")}
                sortOptions={characterSortOptions}
                filterLabel={t("ui.list.filterBy")}
                filterValue={characterOwnershipFilter}
                onFilterChange={(value) =>
                  setCharacterOwnershipFilter(value as CharacterOwnershipFilter)
                }
                filterOptions={[
                  { value: "all", label: t("ui.labels.ownership.all") },
                  { value: "mine", label: t("ui.labels.ownership.mine") },
                  { value: "others", label: t("ui.labels.ownership.others") },
                ]}
              />

              <div className="space-y-2">
                <div className="grid gap-2 px-1 text-[11px] font-medium text-muted-foreground md:grid-cols-[1fr_170px]">
                  <div>{t("ui.characters.title")}</div>
                  <div>{t("ui.fields.campaign")}</div>
                </div>
                {pagedCharacters.map((character) => {
                  const campaign = character.campaign_id
                    ? campaignById.get(character.campaign_id) ?? null
                    : null;

                  return (
                    <ListItemRow key={character.id}>
                      <div className="grid gap-2 md:grid-cols-[1fr_170px]">
                        <div className="space-y-1">
                          <Link href={`/characters/${character.id}`} className={textLinkClassName}>
                            <TitleWithPrivacy
                              title={character.name}
                              isPrivate={character.is_private}
                              className="font-medium"
                            />
                          </Link>
                          <div className="flex flex-wrap items-center gap-2">
                            {character.owner_user_id === currentUserId ? (
                              <OwnershipBadge mode="mine" t={t} />
                            ) : null}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {campaign ? (
                            <Link href={`/campaigns/${campaign.id}`} className={textLinkClassName}>
                              {campaign.title}
                            </Link>
                          ) : (
                            "-"
                          )}
                        </div>
                      </div>
                    </ListItemRow>
                  );
                })}
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("ui.campaigns.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ListControls
                searchValue={campaignSearchQuery}
                onSearchChange={setCampaignSearchQuery}
                searchPlaceholder={t("ui.list.searchCampaigns")}
                sortValue={campaignSortBy}
                onSortChange={(value) => setCampaignSortBy(value as CampaignListSort)}
                sortLabel={t("ui.list.sortBy")}
                sortOptions={campaignSortOptions}
              />

              <div className="space-y-2">
                <div className="grid gap-2 px-1 text-[11px] font-medium text-muted-foreground md:grid-cols-[1fr_150px_80px]">
                  <div>{t("ui.campaigns.title")}</div>
                  <div>{t("ui.admin.ownerLabel")}</div>
                  <div>{t("ui.fields.players")}</div>
                </div>
                {pagedCampaigns.map((campaign) => (
                  <ListItemRow key={campaign.id}>
                    <div className="grid gap-2 md:grid-cols-[1fr_150px_80px]">
                      <div className="space-y-1">
                        <Link href={`/campaigns/${campaign.id}`} className={textLinkClassName}>
                          <TitleWithPrivacy
                            title={campaign.title}
                            isPrivate={campaign.is_private}
                            className="font-medium"
                          />
                        </Link>
                        <div className="flex flex-wrap items-center gap-2">
                          {campaign.current_user_role ? (
                            <CampaignRoleBadge role={campaign.current_user_role} t={t} />
                          ) : null}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {campaign.owner_role === "admin" ? (
                          <span>{campaign.owner_username ?? campaign.owner_user_id}</span>
                        ) : (
                          <Link
                            href={`/users/${campaign.owner_user_id}`}
                            className={textLinkClassName}
                          >
                            {campaign.owner_username ?? campaign.owner_user_id}
                          </Link>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">{campaign.player_count ?? 0}</div>
                    </div>
                  </ListItemRow>
                ))}
                {searchedAndSortedCampaigns.length === 0 ? (
                  <EmptyState
                    label={t("ui.feedback.empty")}
                    className="border-0 bg-transparent p-0 text-muted-foreground"
                  />
                ) : null}
              </div>

              <PaginationControls
                page={safeCampaignPage}
                pageSize={DEFAULT_LIST_PAGE_SIZE}
                totalItems={searchedAndSortedCampaigns.length}
                previousLabel={t("ui.list.previous")}
                nextLabel={t("ui.list.next")}
                pageLabel={t("ui.list.page")}
                onPageChange={setCampaignPage}
              />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
