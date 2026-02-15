"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/common/app-header";
import { Modal } from "@/components/common/modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminDashboard } from "@/features/admin/hooks/use-admin-dashboard";
import type {
  AdminCampaign,
  AdminCharacter,
  AdminCreateCampaignInput,
  AdminCreateCharacterInput,
  AdminCreateUserInput,
  AdminUser,
} from "@/features/admin/types";
import { useClientSession } from "@/lib/client/use-client-session";
import { getTranslator, type AppLocale } from "@/lib/i18n";

type AdminPageViewProps = {
  locale: AppLocale;
};

const fieldClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";

const defaultCreateUserForm: AdminCreateUserInput = {
  email: "",
  password: "",
  username: "",
  description: "",
  locale: "en",
};

const defaultCreateCampaignForm: AdminCreateCampaignInput = {
  ownerUserId: "",
  title: "",
  description: "",
};

const defaultCreateCharacterForm: AdminCreateCharacterInput = {
  ownerUserId: "",
  campaignId: null,
  type: "player",
  name: "",
  age: null,
  description: "",
  avatarPath: null,
};

function parseNumberOrNull(value: string): number | null {
  if (!value.trim()) {
    return null;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

export function AdminPageView({ locale }: AdminPageViewProps) {
  const t = useMemo(() => getTranslator(locale), [locale]);
  const router = useRouter();
  const { session, ready } = useClientSession();
  const admin = useAdminDashboard(session);

  const [message, setMessage] = useState("");

  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [deleteUser, setDeleteUser] = useState<AdminUser | null>(null);
  const [createUserForm, setCreateUserForm] = useState<AdminCreateUserInput>(defaultCreateUserForm);
  const [editUserForm, setEditUserForm] = useState({
    email: "",
    password: "",
    username: "",
    description: "",
    locale: "en" as "en" | "de",
  });

  const [createCampaignOpen, setCreateCampaignOpen] = useState(false);
  const [editCampaign, setEditCampaign] = useState<AdminCampaign | null>(null);
  const [deleteCampaign, setDeleteCampaign] = useState<AdminCampaign | null>(null);
  const [createCampaignForm, setCreateCampaignForm] =
    useState<AdminCreateCampaignInput>(defaultCreateCampaignForm);
  const [editCampaignForm, setEditCampaignForm] = useState({
    ownerUserId: "",
    title: "",
    description: "",
  });

  const [createCharacterOpen, setCreateCharacterOpen] = useState(false);
  const [editCharacter, setEditCharacter] = useState<AdminCharacter | null>(null);
  const [deleteCharacter, setDeleteCharacter] = useState<AdminCharacter | null>(null);
  const [createCharacterForm, setCreateCharacterForm] = useState({
    ...defaultCreateCharacterForm,
    ageText: "",
    campaignIdText: "",
    avatarPathText: "",
  });
  const [editCharacterForm, setEditCharacterForm] = useState({
    ownerUserId: "",
    campaignIdText: "",
    type: "player" as "player" | "npc",
    name: "",
    ageText: "",
    description: "",
    avatarPathText: "",
  });

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

  const users = useMemo(() => admin.usersQuery.data ?? [], [admin.usersQuery.data]);
  const campaigns = useMemo(() => admin.campaignsQuery.data ?? [], [admin.campaignsQuery.data]);
  const characters = useMemo(
    () => admin.charactersQuery.data ?? [],
    [admin.charactersQuery.data],
  );
  const userById = useMemo(() => new Map(users.map((user) => [user.id, user])), [users]);
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

  if (!ready || !session) {
    return <main className="min-h-screen" />;
  }

  if (admin.meQuery.isLoading || meRole !== "admin") {
    return (
      <div className="min-h-screen">
        <AppHeader locale={locale} session={session} />
        <main className="mx-auto w-full max-w-7xl px-4 py-8">
          <Card>
            <CardContent className="py-6 text-sm text-muted-foreground">
              {t("ui.start.loading")}
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(130deg,oklch(0.96_0.04_76),oklch(0.98_0.01_180)_40%,oklch(0.95_0.05_138))]">
      <AppHeader locale={locale} session={session} />
      <main className="mx-auto w-full max-w-7xl space-y-4 px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>{t("ui.admin.title")}</CardTitle>
            <CardDescription>{t("ui.admin.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            {feedback ? (
              <div className="rounded-md border border-border bg-background p-2 text-xs">
                {feedback}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("ui.admin.usersTitle")}</CardTitle>
            <CardDescription>{t("ui.admin.usersSubtitle")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={() => setCreateUserOpen(true)}>{t("ui.admin.createUser")}</Button>
            {users.length === 0 ? (
              <div className="rounded-lg border border-border bg-background/70 p-3 text-xs text-muted-foreground">
                {t("ui.feedback.empty")}
              </div>
            ) : (
              users.map((user) => (
                <div
                  key={user.id}
                  className="grid gap-2 rounded-lg border border-border bg-background/70 p-3 md:grid-cols-[1fr_auto]"
                >
                  <div>
                    <div className="font-medium">
                      {user.username} ({user.email})
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {user.role} - {user.id}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
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
                    >
                      {t("ui.actions.edit")}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={user.id === admin.meQuery.data?.user.id}
                      onClick={() => setDeleteUser(user)}
                    >
                      {t("ui.actions.delete")}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("ui.admin.campaignsTitle")}</CardTitle>
            <CardDescription>{t("ui.admin.campaignsSubtitle")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
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
            {campaigns.length === 0 ? (
              <div className="rounded-lg border border-border bg-background/70 p-3 text-xs text-muted-foreground">
                {t("ui.feedback.empty")}
              </div>
            ) : (
              campaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="grid gap-2 rounded-lg border border-border bg-background/70 p-3 md:grid-cols-[1fr_auto]"
                >
                  <div>
                    <div className="font-medium">{campaign.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {t("ui.admin.ownerLabel")}:{" "}
                      {userById.get(campaign.owner_user_id)?.username ?? campaign.owner_user_id}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditCampaign(campaign);
                        setEditCampaignForm({
                          ownerUserId: campaign.owner_user_id,
                          title: campaign.title,
                          description: campaign.description ?? "",
                        });
                      }}
                    >
                      {t("ui.actions.edit")}
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => setDeleteCampaign(campaign)}>
                      {t("ui.actions.delete")}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("ui.admin.charactersTitle")}</CardTitle>
            <CardDescription>{t("ui.admin.charactersSubtitle")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
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
            {characters.length === 0 ? (
              <div className="rounded-lg border border-border bg-background/70 p-3 text-xs text-muted-foreground">
                {t("ui.feedback.empty")}
              </div>
            ) : (
              characters.map((character) => (
                <div
                  key={character.id}
                  className="grid gap-2 rounded-lg border border-border bg-background/70 p-3 md:grid-cols-[1fr_auto]"
                >
                  <div>
                    <div className="font-medium">
                      {character.name} ({character.type})
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t("ui.admin.ownerLabel")}:{" "}
                      {userById.get(character.owner_user_id)?.username ?? character.owner_user_id}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditCharacter(character);
                        setEditCharacterForm({
                          ownerUserId: character.owner_user_id,
                          campaignIdText: character.campaign_id ?? "",
                          type: character.type,
                          name: character.name,
                          ageText:
                            character.age === null || character.age === undefined
                              ? ""
                              : String(character.age),
                          description: character.description ?? "",
                          avatarPathText: character.avatar_path ?? "",
                        });
                      }}
                    >
                      {t("ui.actions.edit")}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setDeleteCharacter(character)}
                    >
                      {t("ui.actions.delete")}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </main>

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
                    setMessage(error instanceof Error ? error.message : t("ui.feedback.requestFailed"));
                  }
                })()
              }
            >
              {t("ui.actions.create")}
            </Button>
          </>
        }
      >
        <div className="grid gap-2">
          <input
            className={fieldClass}
            placeholder={t("ui.fields.email")}
            value={createUserForm.email}
            onChange={(event) =>
              setCreateUserForm((prev) => ({ ...prev, email: event.target.value }))
            }
          />
          <input
            className={fieldClass}
            placeholder={t("ui.fields.password")}
            value={createUserForm.password}
            onChange={(event) =>
              setCreateUserForm((prev) => ({ ...prev, password: event.target.value }))
            }
          />
          <input
            className={fieldClass}
            placeholder={t("ui.fields.username")}
            value={createUserForm.username}
            onChange={(event) =>
              setCreateUserForm((prev) => ({ ...prev, username: event.target.value }))
            }
          />
          <textarea
            className={`${fieldClass} min-h-20`}
            placeholder={t("ui.fields.description")}
            value={createUserForm.description}
            onChange={(event) =>
              setCreateUserForm((prev) => ({ ...prev, description: event.target.value }))
            }
          />
          <select
            className={fieldClass}
            value={createUserForm.locale}
            onChange={(event) =>
              setCreateUserForm((prev) => ({ ...prev, locale: event.target.value as "en" | "de" }))
            }
          >
            <option value="en">en</option>
            <option value="de">de</option>
          </select>
        </div>
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
              disabled={admin.anyPending || !editUser}
              onClick={() =>
                void (async () => {
                  if (!editUser) {
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
                    setMessage(error instanceof Error ? error.message : t("ui.feedback.requestFailed"));
                  }
                })()
              }
            >
              {t("ui.actions.save")}
            </Button>
          </>
        }
      >
        <div className="grid gap-2">
          <input
            className={fieldClass}
            placeholder={t("ui.fields.email")}
            value={editUserForm.email}
            onChange={(event) => setEditUserForm((prev) => ({ ...prev, email: event.target.value }))}
          />
          <input
            className={fieldClass}
            placeholder={t("ui.admin.newPasswordOptional")}
            value={editUserForm.password}
            onChange={(event) =>
              setEditUserForm((prev) => ({ ...prev, password: event.target.value }))
            }
          />
          <input
            className={fieldClass}
            placeholder={t("ui.fields.username")}
            value={editUserForm.username}
            onChange={(event) =>
              setEditUserForm((prev) => ({ ...prev, username: event.target.value }))
            }
          />
          <textarea
            className={`${fieldClass} min-h-20`}
            placeholder={t("ui.fields.description")}
            value={editUserForm.description}
            onChange={(event) =>
              setEditUserForm((prev) => ({ ...prev, description: event.target.value }))
            }
          />
          <select
            className={fieldClass}
            value={editUserForm.locale}
            onChange={(event) =>
              setEditUserForm((prev) => ({ ...prev, locale: event.target.value as "en" | "de" }))
            }
          >
            <option value="en">en</option>
            <option value="de">de</option>
          </select>
        </div>
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
              disabled={admin.anyPending || !deleteUser}
              onClick={() =>
                void (async () => {
                  if (!deleteUser) {
                    return;
                  }
                  try {
                    await admin.deleteUserMutation.mutateAsync(deleteUser.id);
                    setDeleteUser(null);
                    setMessage(t("ui.feedback.deleted"));
                  } catch (error) {
                    setMessage(error instanceof Error ? error.message : t("ui.feedback.requestFailed"));
                  }
                })()
              }
            >
              {t("ui.actions.confirmDelete")}
            </Button>
          </>
        }
      >
        <div className="text-sm">{t("ui.admin.deleteUserConfirm")}</div>
      </Modal>

      <Modal
        open={createCampaignOpen}
        title={t("ui.admin.createCampaign")}
        onClose={() => setCreateCampaignOpen(false)}
        footer={
          <>
            <Button variant="outline" onClick={() => setCreateCampaignOpen(false)}>
              {t("ui.actions.close")}
            </Button>
            <Button
              disabled={admin.anyPending}
              onClick={() =>
                void (async () => {
                  try {
                    await admin.createCampaignMutation.mutateAsync(createCampaignForm);
                    setCreateCampaignOpen(false);
                    setCreateCampaignForm(defaultCreateCampaignForm);
                    setMessage(t("ui.feedback.created"));
                  } catch (error) {
                    setMessage(error instanceof Error ? error.message : t("ui.feedback.requestFailed"));
                  }
                })()
              }
            >
              {t("ui.actions.create")}
            </Button>
          </>
        }
      >
        <div className="grid gap-2">
          <label className="text-xs text-muted-foreground">{t("ui.admin.ownerLabel")}</label>
          <select
            className={fieldClass}
            value={createCampaignForm.ownerUserId}
            onChange={(event) =>
              setCreateCampaignForm((prev) => ({ ...prev, ownerUserId: event.target.value }))
            }
          >
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.username} ({user.email})
              </option>
            ))}
          </select>
          <input
            className={fieldClass}
            placeholder={t("ui.fields.campaignTitle")}
            value={createCampaignForm.title}
            onChange={(event) =>
              setCreateCampaignForm((prev) => ({ ...prev, title: event.target.value }))
            }
          />
          <textarea
            className={`${fieldClass} min-h-20`}
            placeholder={t("ui.fields.campaignDescription")}
            value={createCampaignForm.description}
            onChange={(event) =>
              setCreateCampaignForm((prev) => ({ ...prev, description: event.target.value }))
            }
          />
        </div>
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
                    setMessage(error instanceof Error ? error.message : t("ui.feedback.requestFailed"));
                  }
                })()
              }
            >
              {t("ui.actions.save")}
            </Button>
          </>
        }
      >
        <div className="grid gap-2">
          <label className="text-xs text-muted-foreground">{t("ui.admin.ownerLabel")}</label>
          <select
            className={fieldClass}
            value={editCampaignForm.ownerUserId}
            onChange={(event) =>
              setEditCampaignForm((prev) => ({ ...prev, ownerUserId: event.target.value }))
            }
          >
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.username} ({user.email})
              </option>
            ))}
          </select>
          <input
            className={fieldClass}
            placeholder={t("ui.fields.campaignTitle")}
            value={editCampaignForm.title}
            onChange={(event) =>
              setEditCampaignForm((prev) => ({ ...prev, title: event.target.value }))
            }
          />
          <textarea
            className={`${fieldClass} min-h-20`}
            placeholder={t("ui.fields.campaignDescription")}
            value={editCampaignForm.description}
            onChange={(event) =>
              setEditCampaignForm((prev) => ({ ...prev, description: event.target.value }))
            }
          />
        </div>
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
                    await admin.deleteCampaignMutation.mutateAsync(deleteCampaign.id);
                    setDeleteCampaign(null);
                    setMessage(t("ui.feedback.deleted"));
                  } catch (error) {
                    setMessage(error instanceof Error ? error.message : t("ui.feedback.requestFailed"));
                  }
                })()
              }
            >
              {t("ui.actions.confirmDelete")}
            </Button>
          </>
        }
      >
        <div className="text-sm">{t("ui.campaigns.deleteConfirm")}</div>
      </Modal>

      <Modal
        open={createCharacterOpen}
        title={t("ui.admin.createCharacter")}
        onClose={() => setCreateCharacterOpen(false)}
        footer={
          <>
            <Button variant="outline" onClick={() => setCreateCharacterOpen(false)}>
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
                    });
                    setCreateCharacterOpen(false);
                    setCreateCharacterForm({
                      ...defaultCreateCharacterForm,
                      ageText: "",
                      campaignIdText: "",
                      avatarPathText: "",
                    });
                    setMessage(t("ui.feedback.created"));
                  } catch (error) {
                    setMessage(error instanceof Error ? error.message : t("ui.feedback.requestFailed"));
                  }
                })()
              }
            >
              {t("ui.actions.create")}
            </Button>
          </>
        }
      >
        <div className="grid gap-2">
          <label className="text-xs text-muted-foreground">{t("ui.admin.ownerLabel")}</label>
          <select
            className={fieldClass}
            value={createCharacterForm.ownerUserId}
            onChange={(event) =>
              setCreateCharacterForm((prev) => ({ ...prev, ownerUserId: event.target.value }))
            }
          >
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.username} ({user.email})
              </option>
            ))}
          </select>

          <label className="text-xs text-muted-foreground">{t("ui.admin.campaignLabel")}</label>
          <select
            className={fieldClass}
            value={createCharacterForm.campaignIdText}
            onChange={(event) =>
              setCreateCharacterForm((prev) => ({ ...prev, campaignIdText: event.target.value }))
            }
          >
            <option value="">{t("ui.admin.noCampaign")}</option>
            {campaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.title}
              </option>
            ))}
          </select>

          <select
            className={fieldClass}
            value={createCharacterForm.type}
            onChange={(event) =>
              setCreateCharacterForm((prev) => ({
                ...prev,
                type: event.target.value as "player" | "npc",
              }))
            }
          >
            <option value="player">player</option>
            <option value="npc">npc</option>
          </select>
          <input
            className={fieldClass}
            placeholder={t("ui.fields.characterName")}
            value={createCharacterForm.name}
            onChange={(event) =>
              setCreateCharacterForm((prev) => ({ ...prev, name: event.target.value }))
            }
          />
          <input
            className={fieldClass}
            placeholder={t("ui.fields.characterAge")}
            value={createCharacterForm.ageText}
            onChange={(event) =>
              setCreateCharacterForm((prev) => ({ ...prev, ageText: event.target.value }))
            }
          />
          <input
            className={fieldClass}
            placeholder={t("ui.characterEdit.avatarPath")}
            value={createCharacterForm.avatarPathText}
            onChange={(event) =>
              setCreateCharacterForm((prev) => ({ ...prev, avatarPathText: event.target.value }))
            }
          />
          <textarea
            className={`${fieldClass} min-h-20`}
            placeholder={t("ui.fields.description")}
            value={createCharacterForm.description}
            onChange={(event) =>
              setCreateCharacterForm((prev) => ({ ...prev, description: event.target.value }))
            }
          />
        </div>
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
                      },
                    });
                    setEditCharacter(null);
                    setMessage(t("ui.feedback.saved"));
                  } catch (error) {
                    setMessage(error instanceof Error ? error.message : t("ui.feedback.requestFailed"));
                  }
                })()
              }
            >
              {t("ui.actions.save")}
            </Button>
          </>
        }
      >
        <div className="grid gap-2">
          <label className="text-xs text-muted-foreground">{t("ui.admin.ownerLabel")}</label>
          <select
            className={fieldClass}
            value={editCharacterForm.ownerUserId}
            onChange={(event) =>
              setEditCharacterForm((prev) => ({ ...prev, ownerUserId: event.target.value }))
            }
          >
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.username} ({user.email})
              </option>
            ))}
          </select>
          <label className="text-xs text-muted-foreground">{t("ui.admin.campaignLabel")}</label>
          <select
            className={fieldClass}
            value={editCharacterForm.campaignIdText}
            onChange={(event) =>
              setEditCharacterForm((prev) => ({ ...prev, campaignIdText: event.target.value }))
            }
          >
            <option value="">{t("ui.admin.noCampaign")}</option>
            {campaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.title}
              </option>
            ))}
          </select>
          <select
            className={fieldClass}
            value={editCharacterForm.type}
            onChange={(event) =>
              setEditCharacterForm((prev) => ({
                ...prev,
                type: event.target.value as "player" | "npc",
              }))
            }
          >
            <option value="player">player</option>
            <option value="npc">npc</option>
          </select>
          <input
            className={fieldClass}
            placeholder={t("ui.fields.characterName")}
            value={editCharacterForm.name}
            onChange={(event) =>
              setEditCharacterForm((prev) => ({ ...prev, name: event.target.value }))
            }
          />
          <input
            className={fieldClass}
            placeholder={t("ui.fields.characterAge")}
            value={editCharacterForm.ageText}
            onChange={(event) =>
              setEditCharacterForm((prev) => ({ ...prev, ageText: event.target.value }))
            }
          />
          <input
            className={fieldClass}
            placeholder={t("ui.characterEdit.avatarPath")}
            value={editCharacterForm.avatarPathText}
            onChange={(event) =>
              setEditCharacterForm((prev) => ({ ...prev, avatarPathText: event.target.value }))
            }
          />
          <textarea
            className={`${fieldClass} min-h-20`}
            placeholder={t("ui.fields.description")}
            value={editCharacterForm.description}
            onChange={(event) =>
              setEditCharacterForm((prev) => ({ ...prev, description: event.target.value }))
            }
          />
        </div>
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
                    await admin.deleteCharacterMutation.mutateAsync(deleteCharacter.id);
                    setDeleteCharacter(null);
                    setMessage(t("ui.feedback.deleted"));
                  } catch (error) {
                    setMessage(error instanceof Error ? error.message : t("ui.feedback.requestFailed"));
                  }
                })()
              }
            >
              {t("ui.actions.confirmDelete")}
            </Button>
          </>
        }
      >
        <div className="text-sm">{t("ui.characters.deleteConfirm")}</div>
      </Modal>
    </div>
  );
}
