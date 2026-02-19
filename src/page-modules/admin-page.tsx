"use client";

import { UiDiv } from "@/components/ui/html-elements";
import { AppPageMain, PageViewport } from "@/components/ui/page-shell";
import { TextLink } from "@/components/ui/text-link";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { IconActionButton } from "@/components/ui/icon-action-button";
import { ListItemRow } from "@/components/ui/list-item-row";
import { NavTabs } from "@/components/ui/nav-tabs";
import { Modal } from "@/components/ui/modal";
import { PageLoadingState } from "@/components/ui/page-loading-state";
import {
  CampaignFormFields,
  CharacterFormFields,
  type AdminCampaignFormValues,
  type AdminCharacterFormValues,
  type AdminUserFormValues,
  UserFormFields,
} from "@/page-modules/admin-page-forms";
import { TitleWithPrivacy } from "@/components/ui/title-with-privacy";
import { Button } from "@/components/ui/button";
import { appRoutes } from "@/app/router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAdminDashboard } from "@/features/admin/hooks/use-admin-dashboard";
import { CharacterTypeBadge } from "@/features/characters/components/character-type-badge";
import type {
  AdminCampaign,
  AdminCharacter,
  AdminCreateUserInput,
  AdminUser,
} from "@/features/admin/types";
import { useClientSession } from "@/lib/client/use-client-session";
import { getTranslator, type AppLocale } from "@/lib/i18n";
import { hasItems } from "@/lib/logic/collections";

type AdminPageViewProps = {
  locale: AppLocale;
  section: "users" | "campaigns" | "characters";
};

const defaultCreateUserForm: AdminCreateUserInput = {
  email: "",
  password: "",
  username: "",
  description: "",
  locale: "en",
};

const defaultEditUserForm: AdminUserFormValues = {
  email: "",
  password: "",
  username: "",
  description: "",
  locale: "en",
};

const defaultCreateCampaignForm: AdminCampaignFormValues = {
  ownerUserId: "",
  title: "",
  description: "",
  isPrivate: false,
};

const defaultEditCampaignForm: AdminCampaignFormValues = {
  ownerUserId: "",
  title: "",
  description: "",
  isPrivate: false,
};

const defaultCreateCharacterFormView: AdminCharacterFormValues = {
  ownerUserId: "",
  campaignIdText: "",
  type: "player",
  name: "",
  ageText: "",
  description: "",
  avatarPathText: "",
  isPrivate: false,
};

const defaultEditCharacterForm: AdminCharacterFormValues = {
  ownerUserId: "",
  campaignIdText: "",
  type: "player",
  name: "",
  ageText: "",
  description: "",
  avatarPathText: "",
  isPrivate: false,
};

function parseNumberOrNull(value: string): number | null {
  if (!value.trim()) {
    return null;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function isProtectedAdminUser(user: AdminUser): boolean {
  return user.role === "admin";
}

export function AdminPageView({ locale, section }: AdminPageViewProps) {
  const t = useMemo(() => getTranslator(locale), [locale]);
  const router = useRouter();
  const { session, ready } = useClientSession();
  const admin = useAdminDashboard(session);

  const [message, setMessage] = useState("");

  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [deleteUser, setDeleteUser] = useState<AdminUser | null>(null);
  const [createUserForm, setCreateUserForm] = useState<AdminCreateUserInput>(
    defaultCreateUserForm,
  );
  const [editUserForm, setEditUserForm] =
    useState<AdminUserFormValues>(defaultEditUserForm);

  const [createCampaignOpen, setCreateCampaignOpen] = useState(false);
  const [editCampaign, setEditCampaign] = useState<AdminCampaign | null>(null);
  const [deleteCampaign, setDeleteCampaign] = useState<AdminCampaign | null>(
    null,
  );
  const [createCampaignForm, setCreateCampaignForm] =
    useState<AdminCampaignFormValues>(defaultCreateCampaignForm);
  const [editCampaignForm, setEditCampaignForm] =
    useState<AdminCampaignFormValues>(defaultEditCampaignForm);

  const [createCharacterOpen, setCreateCharacterOpen] = useState(false);
  const [editCharacter, setEditCharacter] = useState<AdminCharacter | null>(
    null,
  );
  const [deleteCharacter, setDeleteCharacter] = useState<AdminCharacter | null>(
    null,
  );
  const [createCharacterForm, setCreateCharacterForm] =
    useState<AdminCharacterFormValues>(defaultCreateCharacterFormView);
  const [editCharacterForm, setEditCharacterForm] =
    useState<AdminCharacterFormValues>(defaultEditCharacterForm);

  useEffect(() => {
    if (!ready) {
      return;
    }
    if (!session) {
      router.replace("/");
    }
  }, [ready, router, session]);

  const meRole = admin.meQuery.data?.profile.role;

  useEffect(() => {
    if (!ready || !session || admin.meQuery.isLoading) {
      return;
    }

    if (meRole !== "admin") {
      router.replace("/");
    }
  }, [ready, session, admin.meQuery.isLoading, meRole, router]);

  const users = useMemo(
    () => admin.usersQuery.data ?? [],
    [admin.usersQuery.data],
  );
  const campaigns = useMemo(
    () => admin.campaignsQuery.data ?? [],
    [admin.campaignsQuery.data],
  );
  const characters = useMemo(
    () => admin.charactersQuery.data ?? [],
    [admin.charactersQuery.data],
  );
  const userById = useMemo(
    () => new Map(users.map((user) => [user.id, user])),
    [users],
  );
  const firstUserId = users[0]?.id ?? "";

  const queryErrors = [
    admin.meQuery.error,
    admin.usersQuery.error,
    admin.campaignsQuery.error,
    admin.charactersQuery.error,
  ]
    .filter((error): error is Error => error instanceof Error)
    .map((error) => error.message);

  const feedback = message || queryErrors[0] || "";
  const mfaRequiredError = queryErrors.find((error) =>
    error.toLowerCase().includes("admin mfa is required"),
  );
  const sectionTabs = [
    {
      key: "users" as const,
      href: "/admin/users",
      label: t("ui.admin.usersTitle"),
    },
    {
      key: "campaigns" as const,
      href: "/admin/campaigns",
      label: t("ui.admin.campaignsTitle"),
    },
    {
      key: "characters" as const,
      href: "/admin/characters",
      label: t("ui.admin.charactersTitle"),
    },
  ];
  const adminSectionRoute =
    section === "campaigns"
      ? appRoutes.adminCampaigns
      : section === "characters"
        ? appRoutes.adminCharacters
        : appRoutes.adminUsers;

  if (!ready || !session) {
    return <PageViewport />;
  }

  if (mfaRequiredError) {
    return (
      <AppPageMain maxWidth="4xl">
        <Card>
          <CardHeader>
            <CardTitle>{t("ui.settings.mfaTitle")}</CardTitle>
            <CardDescription>{t("ui.settings.mfaRequired")}</CardDescription>
          </CardHeader>
          <CardContent stack={3}>
            <FeedbackMessage message={mfaRequiredError} />
            <Link
              href={`${appRoutes.adminMfaChallenge}?returnTo=${encodeURIComponent(adminSectionRoute)}`}
            >
              <Button>{t("ui.actions.verifyMfa")}</Button>
            </Link>
          </CardContent>
        </Card>
      </AppPageMain>
    );
  }

  if (admin.meQuery.isLoading || meRole !== "admin") {
    return (
      <AppPageMain maxWidth="7xl">
        <PageLoadingState label={t("ui.loading.page")} density="section" />
      </AppPageMain>
    );
  }

  return (
    <>
      <AppPageMain maxWidth="7xl" layout="stack-4">
        <Card>
          <CardHeader>
            <CardTitle>{t("ui.admin.title")}</CardTitle>
            <CardDescription>{t("ui.admin.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            <FeedbackMessage message={feedback} />
          </CardContent>
        </Card>

        <Card>
          <CardContent paddingTop={6}>
            <NavTabs activeKey={section} tabs={sectionTabs} />
          </CardContent>
        </Card>

        {section === "users" ? (
          <Card>
            <CardHeader>
              <CardTitle>{t("ui.admin.usersTitle")}</CardTitle>
              <CardDescription>{t("ui.admin.usersSubtitle")}</CardDescription>
            </CardHeader>
            <CardContent stack={3}>
              <Button onClick={() => setCreateUserOpen(true)}>
                {t("ui.admin.createUser")}
              </Button>
              {!hasItems(users) ? (
                <EmptyState label={t("ui.feedback.empty")} />
              ) : (
                users.map((user) => (
                  <ListItemRow
                    key={user.id}
                    actions={
                      !isProtectedAdminUser(user) ? (
                        <>
                          <IconActionButton
                            label={t("ui.actions.edit")}
                            icon={Pencil}
                            onClick={() => {
                              setEditUser(user);
                              setEditUserForm({
                                email: user.email,
                                password: "",
                                username: user.username,
                                description: user.description ?? "",
                                locale: user.locale,
                              });
                            }}
                          />
                          <IconActionButton
                            label={t("ui.actions.delete")}
                            icon={Trash2}
                            variant="destructive"
                            disabled={user.id === admin.meQuery.data?.user.id}
                            onClick={() => setDeleteUser(user)}
                          />
                        </>
                      ) : null
                    }
                  >
                    {isProtectedAdminUser(user) ? (
                      <UiDiv>
                        <UiDiv textStyle="medium">
                          {user.username} ({user.email})
                        </UiDiv>
                        <UiDiv textStyle="muted-xs">
                          {user.role} - {user.id}
                        </UiDiv>
                      </UiDiv>
                    ) : (
                      <TextLink href={`/users/${user.id}`} display="block">
                        <UiDiv textStyle="medium">
                          {user.username} ({user.email})
                        </UiDiv>
                        <UiDiv textStyle="muted-xs">
                          {user.role} - {user.id}
                        </UiDiv>
                      </TextLink>
                    )}
                  </ListItemRow>
                ))
              )}
            </CardContent>
          </Card>
        ) : null}

        {section === "campaigns" ? (
          <Card>
            <CardHeader>
              <CardTitle>{t("ui.admin.campaignsTitle")}</CardTitle>
              <CardDescription>
                {t("ui.admin.campaignsSubtitle")}
              </CardDescription>
            </CardHeader>
            <CardContent stack={3}>
              <Button
                onClick={() => {
                  setCreateCampaignForm((prev) => ({
                    ...prev,
                    ownerUserId: prev.ownerUserId || firstUserId,
                  }));
                  setCreateCampaignOpen(true);
                }}
              >
                {t("ui.admin.createCampaign")}
              </Button>
              {!hasItems(campaigns) ? (
                <EmptyState label={t("ui.feedback.empty")} />
              ) : (
                campaigns.map((campaign) => (
                  <ListItemRow
                    key={campaign.id}
                    actions={
                      <>
                        <IconActionButton
                          label={t("ui.actions.edit")}
                          icon={Pencil}
                          onClick={() => {
                            setEditCampaign(campaign);
                            setEditCampaignForm({
                              ownerUserId: campaign.owner_user_id,
                              title: campaign.title,
                              description: campaign.description ?? "",
                              isPrivate: campaign.is_private ?? false,
                            });
                          }}
                        />
                        <IconActionButton
                          label={t("ui.actions.delete")}
                          icon={Trash2}
                          variant="destructive"
                          onClick={() => setDeleteCampaign(campaign)}
                        />
                      </>
                    }
                  >
                    <TextLink
                      href={`/campaigns/${campaign.id}`}
                      display="block"
                    >
                      <TitleWithPrivacy
                        title={campaign.title}
                        isPrivate={campaign.is_private}
                        weight="medium"
                      />
                      <UiDiv textStyle="muted-xs">
                        {t("ui.admin.ownerLabel")}:{" "}
                        {userById.get(campaign.owner_user_id)?.username ??
                          campaign.owner_user_id}
                      </UiDiv>
                    </TextLink>
                  </ListItemRow>
                ))
              )}
            </CardContent>
          </Card>
        ) : null}

        {section === "characters" ? (
          <Card>
            <CardHeader>
              <CardTitle>{t("ui.admin.charactersTitle")}</CardTitle>
              <CardDescription>
                {t("ui.admin.charactersSubtitle")}
              </CardDescription>
            </CardHeader>
            <CardContent stack={3}>
              <Button
                onClick={() => {
                  setCreateCharacterForm((prev) => ({
                    ...prev,
                    ownerUserId: prev.ownerUserId || firstUserId,
                  }));
                  setCreateCharacterOpen(true);
                }}
              >
                {t("ui.admin.createCharacter")}
              </Button>
              {!hasItems(characters) ? (
                <EmptyState label={t("ui.feedback.empty")} />
              ) : (
                characters.map((character) => (
                  <ListItemRow
                    key={character.id}
                    actions={
                      <>
                        <IconActionButton
                          label={t("ui.actions.edit")}
                          icon={Pencil}
                          onClick={() => {
                            setEditCharacter(character);
                            setEditCharacterForm({
                              ownerUserId: character.owner_user_id,
                              campaignIdText: character.campaign_id ?? "",
                              type: character.type,
                              name: character.name,
                              ageText:
                                character.age === null ||
                                character.age === undefined
                                  ? ""
                                  : String(character.age),
                              description: character.description ?? "",
                              avatarPathText: character.avatar_path ?? "",
                              isPrivate: character.is_private ?? false,
                            });
                          }}
                        />
                        <IconActionButton
                          label={t("ui.actions.delete")}
                          icon={Trash2}
                          variant="destructive"
                          onClick={() => setDeleteCharacter(character)}
                        />
                      </>
                    }
                  >
                    <TextLink
                      href={`/characters/${character.id}`}
                      display="block"
                    >
                      <TitleWithPrivacy
                        title={character.name}
                        isPrivate={character.is_private}
                        weight="medium"
                      />
                      <CharacterTypeBadge
                        type={character.type}
                        t={t}
                        withTopSpacing
                      />
                      <UiDiv textStyle="muted-xs">
                        {t("ui.admin.ownerLabel")}:{" "}
                        {userById.get(character.owner_user_id)?.username ??
                          character.owner_user_id}
                      </UiDiv>
                    </TextLink>
                  </ListItemRow>
                ))
              )}
            </CardContent>
          </Card>
        ) : null}
      </AppPageMain>

      <Modal
        open={createUserOpen}
        title={t("ui.admin.createUser")}
        onClose={() => setCreateUserOpen(false)}
        footer={
          <>
            <Button variant="outline" onClick={() => setCreateUserOpen(false)}>
              {t("ui.actions.close")}
            </Button>
            <Button
              disabled={admin.anyPending}
              onClick={() =>
                void (async () => {
                  try {
                    await admin.createUserMutation.mutateAsync(createUserForm);
                    setCreateUserOpen(false);
                    setCreateUserForm(defaultCreateUserForm);
                    setMessage(t("ui.feedback.created"));
                  } catch (error) {
                    setMessage(
                      error instanceof Error
                        ? error.message
                        : t("ui.feedback.requestFailed"),
                    );
                  }
                })()
              }
            >
              {t("ui.actions.create")}
            </Button>
          </>
        }
      >
        <UserFormFields
          t={t}
          values={createUserForm}
          passwordPlaceholder={t("ui.fields.password")}
          onChange={setCreateUserForm}
        />
      </Modal>

      <Modal
        open={editUser !== null}
        title={t("ui.admin.editUser")}
        onClose={() => setEditUser(null)}
        footer={
          <>
            <Button variant="outline" onClick={() => setEditUser(null)}>
              {t("ui.actions.close")}
            </Button>
            <Button
              disabled={
                admin.anyPending ||
                !editUser ||
                (editUser ? isProtectedAdminUser(editUser) : false)
              }
              onClick={() =>
                void (async () => {
                  if (!editUser) {
                    return;
                  }
                  if (isProtectedAdminUser(editUser)) {
                    return;
                  }
                  try {
                    await admin.updateUserMutation.mutateAsync({
                      userId: editUser.id,
                      values: {
                        email: editUserForm.email,
                        password: editUserForm.password || undefined,
                        username: editUserForm.username,
                        description: editUserForm.description,
                        locale: editUserForm.locale,
                      },
                    });
                    setEditUser(null);
                    setMessage(t("ui.feedback.saved"));
                  } catch (error) {
                    setMessage(
                      error instanceof Error
                        ? error.message
                        : t("ui.feedback.requestFailed"),
                    );
                  }
                })()
              }
            >
              {t("ui.actions.save")}
            </Button>
          </>
        }
      >
        <UserFormFields
          t={t}
          values={editUserForm}
          passwordPlaceholder={t("ui.admin.newPasswordOptional")}
          onChange={setEditUserForm}
        />
      </Modal>

      <Modal
        open={deleteUser !== null}
        title={t("ui.admin.deleteUser")}
        onClose={() => setDeleteUser(null)}
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteUser(null)}>
              {t("ui.actions.close")}
            </Button>
            <Button
              variant="destructive"
              disabled={
                admin.anyPending ||
                !deleteUser ||
                (deleteUser ? isProtectedAdminUser(deleteUser) : false)
              }
              onClick={() =>
                void (async () => {
                  if (!deleteUser) {
                    return;
                  }
                  if (isProtectedAdminUser(deleteUser)) {
                    return;
                  }
                  try {
                    await admin.deleteUserMutation.mutateAsync(deleteUser.id);
                    setDeleteUser(null);
                    setMessage(t("ui.feedback.deleted"));
                  } catch (error) {
                    setMessage(
                      error instanceof Error
                        ? error.message
                        : t("ui.feedback.requestFailed"),
                    );
                  }
                })()
              }
            >
              {t("ui.actions.confirmDelete")}
            </Button>
          </>
        }
      >
        <UiDiv textStyle="sm">{t("ui.admin.deleteUserConfirm")}</UiDiv>
      </Modal>

      <Modal
        open={createCampaignOpen}
        title={t("ui.admin.createCampaign")}
        onClose={() => setCreateCampaignOpen(false)}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setCreateCampaignOpen(false)}
            >
              {t("ui.actions.close")}
            </Button>
            <Button
              disabled={admin.anyPending}
              onClick={() =>
                void (async () => {
                  try {
                    await admin.createCampaignMutation.mutateAsync(
                      createCampaignForm,
                    );
                    setCreateCampaignOpen(false);
                    setCreateCampaignForm(defaultCreateCampaignForm);
                    setMessage(t("ui.feedback.created"));
                  } catch (error) {
                    setMessage(
                      error instanceof Error
                        ? error.message
                        : t("ui.feedback.requestFailed"),
                    );
                  }
                })()
              }
            >
              {t("ui.actions.create")}
            </Button>
          </>
        }
      >
        <CampaignFormFields
          t={t}
          values={createCampaignForm}
          users={users}
          onChange={setCreateCampaignForm}
        />
      </Modal>

      <Modal
        open={editCampaign !== null}
        title={t("ui.admin.editCampaign")}
        onClose={() => setEditCampaign(null)}
        footer={
          <>
            <Button variant="outline" onClick={() => setEditCampaign(null)}>
              {t("ui.actions.close")}
            </Button>
            <Button
              disabled={admin.anyPending || !editCampaign}
              onClick={() =>
                void (async () => {
                  if (!editCampaign) {
                    return;
                  }
                  try {
                    await admin.updateCampaignMutation.mutateAsync({
                      campaignId: editCampaign.id,
                      values: editCampaignForm,
                    });
                    setEditCampaign(null);
                    setMessage(t("ui.feedback.saved"));
                  } catch (error) {
                    setMessage(
                      error instanceof Error
                        ? error.message
                        : t("ui.feedback.requestFailed"),
                    );
                  }
                })()
              }
            >
              {t("ui.actions.save")}
            </Button>
          </>
        }
      >
        <CampaignFormFields
          t={t}
          values={editCampaignForm}
          users={users}
          onChange={setEditCampaignForm}
        />
      </Modal>

      <Modal
        open={deleteCampaign !== null}
        title={t("ui.admin.deleteCampaign")}
        onClose={() => setDeleteCampaign(null)}
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteCampaign(null)}>
              {t("ui.actions.close")}
            </Button>
            <Button
              variant="destructive"
              disabled={admin.anyPending || !deleteCampaign}
              onClick={() =>
                void (async () => {
                  if (!deleteCampaign) {
                    return;
                  }
                  try {
                    await admin.deleteCampaignMutation.mutateAsync(
                      deleteCampaign.id,
                    );
                    setDeleteCampaign(null);
                    setMessage(t("ui.feedback.deleted"));
                  } catch (error) {
                    setMessage(
                      error instanceof Error
                        ? error.message
                        : t("ui.feedback.requestFailed"),
                    );
                  }
                })()
              }
            >
              {t("ui.actions.confirmDelete")}
            </Button>
          </>
        }
      >
        <UiDiv textStyle="sm">{t("ui.campaigns.deleteConfirm")}</UiDiv>
      </Modal>

      <Modal
        open={createCharacterOpen}
        title={t("ui.admin.createCharacter")}
        onClose={() => setCreateCharacterOpen(false)}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setCreateCharacterOpen(false)}
            >
              {t("ui.actions.close")}
            </Button>
            <Button
              disabled={admin.anyPending}
              onClick={() =>
                void (async () => {
                  try {
                    await admin.createCharacterMutation.mutateAsync({
                      ownerUserId: createCharacterForm.ownerUserId,
                      campaignId: createCharacterForm.campaignIdText || null,
                      type: createCharacterForm.type,
                      name: createCharacterForm.name,
                      age: parseNumberOrNull(createCharacterForm.ageText),
                      description: createCharacterForm.description,
                      avatarPath: createCharacterForm.avatarPathText || null,
                      isPrivate: createCharacterForm.isPrivate,
                    });
                    setCreateCharacterOpen(false);
                    setCreateCharacterForm(defaultCreateCharacterFormView);
                    setMessage(t("ui.feedback.created"));
                  } catch (error) {
                    setMessage(
                      error instanceof Error
                        ? error.message
                        : t("ui.feedback.requestFailed"),
                    );
                  }
                })()
              }
            >
              {t("ui.actions.create")}
            </Button>
          </>
        }
      >
        <CharacterFormFields
          t={t}
          values={createCharacterForm}
          users={users}
          campaigns={campaigns}
          onChange={setCreateCharacterForm}
        />
      </Modal>

      <Modal
        open={editCharacter !== null}
        title={t("ui.admin.editCharacter")}
        onClose={() => setEditCharacter(null)}
        footer={
          <>
            <Button variant="outline" onClick={() => setEditCharacter(null)}>
              {t("ui.actions.close")}
            </Button>
            <Button
              disabled={admin.anyPending || !editCharacter}
              onClick={() =>
                void (async () => {
                  if (!editCharacter) {
                    return;
                  }
                  try {
                    await admin.updateCharacterMutation.mutateAsync({
                      characterId: editCharacter.id,
                      values: {
                        ownerUserId: editCharacterForm.ownerUserId,
                        campaignId: editCharacterForm.campaignIdText || null,
                        type: editCharacterForm.type,
                        name: editCharacterForm.name,
                        age: parseNumberOrNull(editCharacterForm.ageText),
                        description: editCharacterForm.description,
                        avatarPath: editCharacterForm.avatarPathText || null,
                        isPrivate: editCharacterForm.isPrivate,
                      },
                    });
                    setEditCharacter(null);
                    setMessage(t("ui.feedback.saved"));
                  } catch (error) {
                    setMessage(
                      error instanceof Error
                        ? error.message
                        : t("ui.feedback.requestFailed"),
                    );
                  }
                })()
              }
            >
              {t("ui.actions.save")}
            </Button>
          </>
        }
      >
        <CharacterFormFields
          t={t}
          values={editCharacterForm}
          users={users}
          campaigns={campaigns}
          onChange={setEditCharacterForm}
        />
      </Modal>

      <Modal
        open={deleteCharacter !== null}
        title={t("ui.admin.deleteCharacter")}
        onClose={() => setDeleteCharacter(null)}
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteCharacter(null)}>
              {t("ui.actions.close")}
            </Button>
            <Button
              variant="destructive"
              disabled={admin.anyPending || !deleteCharacter}
              onClick={() =>
                void (async () => {
                  if (!deleteCharacter) {
                    return;
                  }
                  try {
                    await admin.deleteCharacterMutation.mutateAsync(
                      deleteCharacter.id,
                    );
                    setDeleteCharacter(null);
                    setMessage(t("ui.feedback.deleted"));
                  } catch (error) {
                    setMessage(
                      error instanceof Error
                        ? error.message
                        : t("ui.feedback.requestFailed"),
                    );
                  }
                })()
              }
            >
              {t("ui.actions.confirmDelete")}
            </Button>
          </>
        }
      >
        <UiDiv textStyle="sm">{t("ui.characters.deleteConfirm")}</UiDiv>
      </Modal>
    </>
  );
}
