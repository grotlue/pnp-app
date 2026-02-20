"use client";

import { UiDiv } from "@/components/ui/html-elements";
import {
  AppPageMain,
  AuthCardPageContent,
  AuthRadialPageMain,
  CompactPageViewport,
  PageViewport,
} from "@/components/ui/page-shell";
import { TextLink } from "@/components/ui/text-link";

import { type ChangeEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { EmptyState } from "@/components/ui/empty-state";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { FormInput } from "@/components/ui/form-controls";
import { ListControls } from "@/components/ui/list-controls";
import { ListItemRow } from "@/components/ui/list-item-row";
import { OwnershipBadge } from "@/components/common/ownership-badge";
import { PageLoadingState } from "@/components/ui/page-loading-state";
import { PaginationControls } from "@/components/ui/pagination-controls";
import {
  type TurnstileErrorReason,
  TurnstileWidget,
} from "@/components/common/turnstile-widget";
import { ToggleTabs } from "@/components/ui/toggle-tabs";
import { TitleWithPrivacy } from "@/components/ui/title-with-privacy";
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
import { CampaignRoleBadge } from "@/features/campaigns/components/campaign-role-badge";
import {
  type CampaignListSort,
  searchCampaigns,
  sortCampaigns,
} from "@/features/campaigns/logic/campaign-list.logic";
import {
  type CharacterListSort,
  type CharacterOwnershipFilter,
  filterCharactersByOwnership,
  searchCharacters,
  sortCharacters,
} from "@/features/characters/logic/character-list.logic";
import { useHomeLoggedInQuery } from "@/features/users/hooks/use-home-logged-in-query";
import { loginUser } from "@/features/users/queries/users-auth.query";
import { resolveAdminMfaStepUpDecision } from "@/features/users/logic/admin-mfa-step-up.logic";
import { getAdminMfaStatus } from "@/features/users/queries/users-mfa.query";
import { getMe } from "@/features/users/queries/users-profile.query";
import type { LoginResponse, MeResponse } from "@/features/users/types";
import { queryKeys } from "@/lib/client/query-keys";
import { setLocaleCookie } from "@/lib/client/locale-cookie";
import {
  clearSession,
  setSession as persistSession,
} from "@/lib/client/session";
import useClientSession from "@/lib/client/use-client-session";
import { resolveAuthCaptchaClientConfig } from "@/lib/features/auth-captcha";
import { type AppLocale, getTranslator, resolveLocale } from "@/lib/i18n/index";
import {
  clampListPage,
  DEFAULT_LIST_PAGE_SIZE,
  paginateListItems,
} from "@/lib/utils/list";

type HomeScreenProps = {
  locale: AppLocale;
  registrationEnabled: boolean;
  registeredNotice?: boolean;
};

const isAuthSessionError = (error: unknown): boolean => {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes("invalid or expired") ||
    message.includes("authorization bearer token is required")
  );
};

const getCaptchaFailureMessage = (
  t: ReturnType<typeof getTranslator>,
  reason: TurnstileErrorReason | null,
): string => {
  if (!reason) {
    return t("ui.feedback.captchaRequired");
  }

  if (reason === "widget_error" || reason === "render_failed") {
    return t("ui.feedback.captchaInitializationFailed");
  }

  return t("ui.feedback.captchaUnavailable");
};

const HomePageView = ({
  locale,
  registrationEnabled,
  registeredNotice = false,
}: HomeScreenProps) => {
  const t = getTranslator(locale);
  const authCaptchaConfig = resolveAuthCaptchaClientConfig();
  const { session, ready } = useClientSession();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(
    registeredNotice ? t("ui.feedback.registeredNowLogin") : "",
  );
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);
  const [captchaErrorReason, setCaptchaErrorReason] =
    useState<TurnstileErrorReason | null>(null);

  const [characterTab, setCharacterTab] = useState<"player" | "npc">("player");
  const [characterOwnershipFilter, setCharacterOwnershipFilter] =
    useState<CharacterOwnershipFilter>("all");
  const [characterSearchQuery, setCharacterSearchQuery] = useState("");
  const [characterSortBy, setCharacterSortBy] =
    useState<CharacterListSort>("updated_desc");
  const [characterPage, setCharacterPage] = useState(1);

  const [campaignSearchQuery, setCampaignSearchQuery] = useState("");
  const [campaignSortBy, setCampaignSortBy] =
    useState<CampaignListSort>("updated_desc");
  const [campaignPage, setCampaignPage] = useState(1);

  const loggedInQuery = useHomeLoggedInQuery(session);

  const onLogin = async () => {
    if (authCaptchaConfig.required && !authCaptchaConfig.enabled) {
      setMessage(t("ui.feedback.captchaMisconfigured"));
      return;
    }

    if (authCaptchaConfig.required && !captchaToken) {
      setMessage(getCaptchaFailureMessage(t, captchaErrorReason));
      return;
    }

    setBusy(true);
    setMessage("");
    try {
      const response: LoginResponse = await loginUser({
        ...loginForm,
        ...(captchaToken ? { captchaToken } : {}),
      });
      const nextSession = {
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        expiresAt: response.expiresAt,
      };
      persistSession(nextSession);

      const me = await getMe(nextSession);
      setLocaleCookie(resolveLocale(me.profile.locale));
      queryClient.setQueryData(queryKeys.me(nextSession.accessToken), me);

      if (me.profile.role === "admin") {
        const mfaStatus = await getAdminMfaStatus(nextSession);
        const stepUpDecision = resolveAdminMfaStepUpDecision({
          role: me.profile.role,
          mfaStatus,
        });

        if (stepUpDecision.kind !== "none") {
          const challengeHref = `${appRoutes.adminMfaChallenge}?returnTo=${encodeURIComponent(appRoutes.adminUsers)}`;
          router.replace(challengeHref);
          return;
        }
      }

      router.replace(appRoutes.home);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : t("ui.feedback.requestFailed"),
      );
    } finally {
      if (authCaptchaConfig.enabled) {
        setCaptchaToken(null);
        setCaptchaErrorReason(null);
        setCaptchaResetKey((prev) => prev + 1);
      }
      setBusy(false);
    }
  };

  const handleLoginEmailChange = (event: ChangeEvent<HTMLInputElement>) => {
    setLoginForm((prev) => ({
      ...prev,
      email: event.target.value,
    }));
  };

  const handleLoginPasswordChange = (event: ChangeEvent<HTMLInputElement>) => {
    setLoginForm((prev) => ({
      ...prev,
      password: event.target.value,
    }));
  };

  const handleCaptchaTokenChange = (token: string | null) => {
    if (token) {
      setCaptchaErrorReason(null);
    }
    setCaptchaToken(token);
  };

  const handleCharacterSortChange = (value: string) => {
    setCharacterSortBy(value as CharacterListSort);
  };

  const handleCharacterOwnershipFilterChange = (value: string) => {
    setCharacterOwnershipFilter(value as CharacterOwnershipFilter);
  };

  const handleCampaignSortChange = (value: string) => {
    setCampaignSortBy(value as CampaignListSort);
  };

  if (!ready) {
    return <CompactPageViewport />;
  }

  if (!session) {
    return (
      <AuthRadialPageMain>
        <AuthCardPageContent>
          <Card>
            <CardHeader>
              <CardTitle>{t("ui.start.loggedOutTitle")}</CardTitle>
              <CardDescription>
                {t("ui.start.loggedOutSubtitle")}
              </CardDescription>
            </CardHeader>
            <CardContent stack={3}>
              <FormInput
                type="email"
                placeholder={t("ui.fields.email")}
                value={loginForm.email}
                onChange={handleLoginEmailChange}
              />
              <FormInput
                type="password"
                placeholder={t("ui.fields.password")}
                value={loginForm.password}
                onChange={handleLoginPasswordChange}
              />
              {authCaptchaConfig.enabled && authCaptchaConfig.siteKey ? (
                <TurnstileWidget
                  siteKey={authCaptchaConfig.siteKey}
                  resetKey={captchaResetKey}
                  loadErrorMessage={t("ui.feedback.captchaUnavailable")}
                  onTokenChange={handleCaptchaTokenChange}
                  onErrorReason={setCaptchaErrorReason}
                />
              ) : null}
              <FeedbackMessage message={message} />
            </CardContent>
            <CardFooter layout="column-stretch">
              <Button disabled={busy} onClick={onLogin}>
                {t("ui.actions.login")}
              </Button>
              <UiDiv contentAlign="between" textStyle="xs">
                <TextLink href={appRoutes.passwordReset}>
                  {t("ui.nav.passwordReset")}
                </TextLink>
                {registrationEnabled ? (
                  <TextLink href={appRoutes.register}>
                    {t("ui.nav.register")}
                  </TextLink>
                ) : null}
              </UiDiv>
            </CardFooter>
          </Card>
        </AuthCardPageContent>
      </AuthRadialPageMain>
    );
  }

  if (loggedInQuery.error && isAuthSessionError(loggedInQuery.error)) {
    clearSession();
    router.replace("/");
    router.refresh();
    return <PageViewport />;
  }

  if (loggedInQuery.isLoading) {
    return (
      <AppPageMain maxWidth="7xl">
        <PageLoadingState label={t("ui.loading.page")} density="section" />
      </AppPageMain>
    );
  }

  const data = loggedInQuery.data;
  const me: MeResponse | null = data?.me ?? null;
  const currentUserId = me?.user.id;
  const publicCampaigns = data?.campaigns ?? [];
  const publicCharacters = data?.characters ?? [];
  const campaignById = new Map(
    publicCampaigns.map((campaign) => [campaign.id, campaign]),
  );

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
    <AppPageMain maxWidth="7xl" layout="grid-4">
      <Card>
        <CardHeader>
          <CardTitle>{t("ui.start.loggedInTitle")}</CardTitle>
          <CardDescription>{t("ui.start.loggedInSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent textStyle="muted-sm">
          {me
            ? `${t("ui.start.welcome")}: ${me.profile.username}`
            : t("ui.start.loggedInSubtitle")}
        </CardContent>
      </Card>

      <UiDiv gridPreset="two-md">
        <Card>
          <CardHeader>
            <CardTitle>{t("ui.characters.title")}</CardTitle>
          </CardHeader>
          <CardContent stack={3}>
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
            <ListControls
              searchValue={characterSearchQuery}
              onSearchChange={setCharacterSearchQuery}
              searchPlaceholder={t("ui.list.searchCharacters")}
              sortValue={characterSortBy}
              onSortChange={handleCharacterSortChange}
              sortLabel={t("ui.list.sortBy")}
              sortOptions={characterSortOptions}
              filterLabel={t("ui.list.filterBy")}
              filterValue={characterOwnershipFilter}
              onFilterChange={handleCharacterOwnershipFilterChange}
              filterOptions={[
                { value: "all", label: t("ui.labels.ownership.all") },
                { value: "mine", label: t("ui.labels.ownership.mine") },
                { value: "others", label: t("ui.labels.ownership.others") },
              ]}
            />

            <UiDiv stack={2}>
              <UiDiv gridPreset="home-character-header">
                <UiDiv>{t("ui.characters.title")}</UiDiv>
                <UiDiv>{t("ui.fields.campaign")}</UiDiv>
              </UiDiv>
              {pagedCharacters.map((character) => {
                const campaign = character.campaign_id
                  ? (campaignById.get(character.campaign_id) ?? null)
                  : null;

                return (
                  <ListItemRow key={character.id}>
                    <UiDiv gridPreset="home-character-row">
                      <UiDiv stack={1}>
                        <TextLink href={`/characters/${character.id}`}>
                          <TitleWithPrivacy
                            title={character.name}
                            isPrivate={character.is_private}
                            weight="medium"
                          />
                        </TextLink>
                        <UiDiv wrapGap={2} contentAlign="center">
                          {character.owner_user_id === currentUserId ? (
                            <OwnershipBadge mode="mine" t={t} />
                          ) : null}
                        </UiDiv>
                      </UiDiv>
                      <UiDiv textStyle="muted-xs">
                        {campaign ? (
                          <TextLink href={`/campaigns/${campaign.id}`}>
                            {campaign.title}
                          </TextLink>
                        ) : (
                          "-"
                        )}
                      </UiDiv>
                    </UiDiv>
                  </ListItemRow>
                );
              })}
              {searchedAndSortedCharacters.length === 0 ? (
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("ui.campaigns.title")}</CardTitle>
          </CardHeader>
          <CardContent stack={3}>
            <ListControls
              searchValue={campaignSearchQuery}
              onSearchChange={setCampaignSearchQuery}
              searchPlaceholder={t("ui.list.searchCampaigns")}
              sortValue={campaignSortBy}
              onSortChange={handleCampaignSortChange}
              sortLabel={t("ui.list.sortBy")}
              sortOptions={campaignSortOptions}
            />

            <UiDiv stack={2}>
              <UiDiv gridPreset="home-campaign-header">
                <UiDiv>{t("ui.campaigns.title")}</UiDiv>
                <UiDiv>{t("ui.admin.ownerLabel")}</UiDiv>
                <UiDiv>{t("ui.fields.players")}</UiDiv>
              </UiDiv>
              {pagedCampaigns.map((campaign) => (
                <ListItemRow key={campaign.id}>
                  <UiDiv gridPreset="home-campaign-row">
                    <UiDiv stack={1}>
                      <TextLink href={`/campaigns/${campaign.id}`}>
                        <TitleWithPrivacy
                          title={campaign.title}
                          isPrivate={campaign.is_private}
                          weight="medium"
                        />
                      </TextLink>
                      <UiDiv wrapGap={2} contentAlign="center">
                        {campaign.current_user_role ? (
                          <CampaignRoleBadge
                            role={campaign.current_user_role}
                            t={t}
                          />
                        ) : null}
                      </UiDiv>
                    </UiDiv>
                    <UiDiv textStyle="muted-xs">
                      {campaign.owner_role === "admin" ? (
                        <span>
                          {campaign.owner_username ?? campaign.owner_user_id}
                        </span>
                      ) : (
                        <TextLink href={`/users/${campaign.owner_user_id}`}>
                          {campaign.owner_username ?? campaign.owner_user_id}
                        </TextLink>
                      )}
                    </UiDiv>
                    <UiDiv textStyle="muted-xs">
                      {campaign.player_count ?? 0}
                    </UiDiv>
                  </UiDiv>
                </ListItemRow>
              ))}
              {searchedAndSortedCampaigns.length === 0 ? (
                <EmptyState label={t("ui.feedback.empty")} variant="ghost" />
              ) : null}
            </UiDiv>

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
      </UiDiv>
    </AppPageMain>
  );
};

export default HomePageView;
