"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/common/empty-state";
import { FeedbackMessage } from "@/components/common/feedback-message";
import { FormInput, FormSelect, FormTextarea } from "@/components/common/form-controls";
import { SectionBox } from "@/components/common/section-box";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AppHeader } from "@/components/common/app-header";
import { Modal } from "@/components/common/modal";
import { PageLoadingState } from "@/components/common/page-loading-state";
import { ToggleTabs } from "@/components/common/toggle-tabs";
import { TitleWithPrivacy } from "@/components/common/title-with-privacy";
import { VisibilityToggle } from "@/components/common/visibility-toggle";
import { useCampaignDetailScreen } from "@/features/campaigns/hooks/use-campaign-detail-screen";
import { canManageCampaign, isAdmin } from "@/features/users/logic/role.logic";
import { getTranslator, type AppLocale } from "@/lib/i18n/index";
import { useClientSession } from "@/lib/client/use-client-session";
import { textLinkClassName } from "@/lib/utils/link";

type CampaignDetailScreenProps = {
  locale: AppLocale;
  campaignId: string;
};

export function CampaignDetailPageView({ locale, campaignId }: CampaignDetailScreenProps) {
  const t = useMemo(() => getTranslator(locale), [locale]);
  const router = useRouter();
  const { session, ready } = useClientSession();
  const {
    detailQuery,
    decideMutation,
    updateMutation,
    deleteMutation,
    inviteMutation,
    assignMutation,
    joinMutation,
    anyPending,
  } = useCampaignDetailScreen(session, campaignId);

  const [message, setMessage] = useState("");
  const [tab, setTab] = useState<"player" | "npc">("player");
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", description: "", isPrivate: false });
  const [inviteUserId, setInviteUserId] = useState("");
  const [assignCharacterId, setAssignCharacterId] = useState("");

  useEffect(() => {
    if (!ready) {
      return;
    }
    if (!session) {
      router.replace("/");
    }
  }, [ready, router, session]);

  if (!ready || !session) {
    return <main className="min-h-screen" />;
  }

  if (detailQuery.isLoading || !detailQuery.data) {
    return (
      <div className="min-h-screen bg-[linear-gradient(130deg,oklch(0.96_0.04_76),oklch(0.98_0.01_180)_40%,oklch(0.95_0.05_138))]">
        <AppHeader locale={locale} session={session} />
        <main className="mx-auto w-full max-w-7xl px-4 py-8">
          <PageLoadingState label={t("ui.loading.page")} />
        </main>
      </div>
    );
  }

  const queryError = detailQuery.error instanceof Error ? detailQuery.error.message : "";
  const feedback = message || queryError;

  const { me, detail, characters, users } = detailQuery.data;
  const isOwner = detail.campaign.owner_user_id === me.user.id;
  const canManage = canManageCampaign({
    isOwner,
    role: me.profile.role,
    isPrivate: detail.campaign.is_private,
  });
  const isForeignAdminView = isAdmin(me.profile.role) && !isOwner;
  const ownMembership = detail.memberships.find((entry) => entry.user_id === me.user.id);
  const canRequestJoin = !canManage && (!ownMembership || ownMembership.state === "rejected");
  const hasPendingJoinRequest =
    !canManage && ownMembership?.source === "request" && ownMembership.state === "pending";

  const acceptedPlayers = detail.memberships.filter((entry) => entry.state === "accepted");
  const campaignCharacters = characters.filter((entry) => entry.campaign_id === campaignId);
  const playerCharacters = campaignCharacters.filter((entry) => entry.type === "player");
  const npcCharacters = campaignCharacters.filter((entry) => entry.type === "npc");

  const assignableCharacters = characters.filter((entry) => {
    if (entry.campaign_id !== null) {
      return false;
    }
    if (entry.owner_user_id !== me.user.id) {
      return false;
    }
    if (!canManage && entry.type !== "player") {
      return false;
    }
    return true;
  });

  const membershipUserIds = new Set(detail.memberships.map((entry) => entry.user_id));
  const inviteCandidates = users.filter(
    (entry) => entry.id !== detail.campaign.owner_user_id && !membershipUserIds.has(entry.id),
  );
  const pendingRequests = detail.memberships.filter(
    (entry) => entry.source === "request" && entry.state === "pending",
  );

  function usernameFor(userId: string) {
    return users.find((entry) => entry.id === userId)?.username ?? userId;
  }

  function isAdminUser(userId: string) {
    return isAdmin(users.find((entry) => entry.id === userId)?.role);
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(130deg,oklch(0.96_0.04_76),oklch(0.98_0.01_180)_40%,oklch(0.95_0.05_138))]">
      <AppHeader locale={locale} session={session} />
      <main className="mx-auto w-full max-w-7xl px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>
              <TitleWithPrivacy
                title={detail.campaign.title}
                isPrivate={detail.campaign.is_private}
                iconClassName="size-4"
              />
            </CardTitle>
            <CardDescription>{t("ui.campaignDetail.subtitle")}</CardDescription>
            {isForeignAdminView ? (
              <div className="inline-flex w-fit rounded-md border border-destructive/40 bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive">
                {t("ui.admin.foreignItemLabel")}
              </div>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {canManage ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditForm({
                        title: detail.campaign.title,
                        description: detail.campaign.description,
                        isPrivate: detail.campaign.is_private ?? false,
                      });
                      setEditOpen(true);
                    }}
                  >
                    {t("ui.actions.edit")}
                  </Button>
                  <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
                    {t("ui.actions.delete")}
                  </Button>
                  <Button variant="outline" onClick={() => setInviteOpen(true)}>
                    {t("ui.campaignDetail.invite")}
                  </Button>
                </>
              ) : null}

              <Button variant="outline" onClick={() => setAssignOpen(true)}>
                {t("ui.campaignDetail.assignCharacter")}
              </Button>

              {canRequestJoin ? (
                <Button variant="outline" onClick={() => setJoinOpen(true)}>
                  {t("ui.campaignDetail.requestJoin")}
                </Button>
              ) : null}
            </div>

            <FeedbackMessage message={feedback} />
            <FeedbackMessage
              message={hasPendingJoinRequest ? t("ui.campaignDetail.joinPending") : ""}
            />

            <SectionBox title={t("ui.fields.campaignDescription")} className="text-sm">
              <div className="mt-1 text-muted-foreground">{detail.campaign.description || "-"}</div>
            </SectionBox>

            <SectionBox title={t("ui.campaignDetail.players")}>
              <div className="space-y-1 text-xs">
                {acceptedPlayers.map((entry) => (
                  isAdminUser(entry.user_id) ? (
                    <div key={entry.id}>{usernameFor(entry.user_id)}</div>
                  ) : (
                    <Link
                      key={entry.id}
                      href={`/users/${entry.user_id}`}
                      className={`block ${textLinkClassName}`}
                    >
                      {usernameFor(entry.user_id)}
                    </Link>
                  )
                ))}
                {acceptedPlayers.length === 0 ? (
                  <EmptyState
                    label={t("ui.feedback.empty")}
                    className="border-0 bg-transparent p-0 text-muted-foreground"
                  />
                ) : null}
              </div>
            </SectionBox>

            {canManage && pendingRequests.length > 0 ? (
              <SectionBox title={t("ui.campaignDetail.pendingRequests")}>
                <div className="space-y-2">
                  {pendingRequests.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex flex-wrap items-center gap-2 rounded border border-border px-2 py-2 text-xs"
                    >
                      {isAdminUser(entry.user_id) ? (
                        <span>{usernameFor(entry.user_id)}</span>
                      ) : (
                        <Link
                          href={`/users/${entry.user_id}`}
                          className={textLinkClassName}
                        >
                          {usernameFor(entry.user_id)}
                        </Link>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={anyPending}
                        onClick={async () => {
                          setMessage("");
                          try {
                            await decideMutation.mutateAsync({
                              membershipId: entry.id,
                              state: "accepted",
                            });
                            setMessage(t("ui.feedback.saved"));
                          } catch (error) {
                            setMessage(
                              error instanceof Error ? error.message : t("ui.feedback.requestFailed"),
                            );
                          }
                        }}
                      >
                        {t("ui.actions.accept")}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={anyPending}
                        onClick={async () => {
                          setMessage("");
                          try {
                            await decideMutation.mutateAsync({
                              membershipId: entry.id,
                              state: "rejected",
                            });
                            setMessage(t("ui.feedback.saved"));
                          } catch (error) {
                            setMessage(
                              error instanceof Error ? error.message : t("ui.feedback.requestFailed"),
                            );
                          }
                        }}
                      >
                        {t("ui.actions.reject")}
                      </Button>
                    </div>
                  ))}
                </div>
              </SectionBox>
            ) : null}

            <SectionBox>
              <div className="mb-2">
                <ToggleTabs
                  value={tab}
                  onChange={setTab}
                  options={[
                    { value: "player", label: t("ui.campaignDetail.playerCharacters") },
                    { value: "npc", label: t("ui.campaignDetail.npcs") },
                  ]}
                />
              </div>
              <div className="space-y-1 text-xs">
                {(tab === "player" ? playerCharacters : npcCharacters).map((entry) => (
                  <Link key={entry.id} href={`/characters/${entry.id}`} className={`flex items-center gap-1 ${textLinkClassName}`}>
                    <TitleWithPrivacy title={entry.name} isPrivate={entry.is_private} />
                  </Link>
                ))}
                {(tab === "player" ? playerCharacters : npcCharacters).length === 0 ? (
                  <EmptyState
                    label={t("ui.feedback.empty")}
                    className="border-0 bg-transparent p-0 text-muted-foreground"
                  />
                ) : null}
              </div>
            </SectionBox>
          </CardContent>
        </Card>
      </main>

      <Modal
        open={editOpen}
        title={t("ui.campaigns.edit")}
        onClose={() => setEditOpen(false)}
        footer={
          <>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              {t("ui.actions.close")}
            </Button>
            <Button
              disabled={anyPending}
              onClick={async () => {
                setMessage("");
                try {
                  await updateMutation.mutateAsync(editForm);
                  setEditOpen(false);
                  setMessage(t("ui.feedback.saved"));
                } catch (error) {
                  setMessage(error instanceof Error ? error.message : t("ui.feedback.requestFailed"));
                }
              }}
            >
              {t("ui.actions.save")}
            </Button>
          </>
        }
      >
        <div className="grid gap-2">
          <FormInput
            value={editForm.title}
            placeholder={t("ui.fields.campaignTitle")}
            onChange={(event) => setEditForm((prev) => ({ ...prev, title: event.target.value }))}
          />
          <FormTextarea
            className="min-h-24"
            value={editForm.description}
            placeholder={t("ui.fields.campaignDescription")}
            onChange={(event) =>
              setEditForm((prev) => ({ ...prev, description: event.target.value }))
            }
          />
          <VisibilityToggle
            isPrivate={editForm.isPrivate}
            label={t("ui.fields.visibilityPrivate")}
            onLabel={t("ui.actions.on")}
            offLabel={t("ui.actions.off")}
            onToggle={() =>
              setEditForm((prev) => ({ ...prev, isPrivate: !prev.isPrivate }))
            }
          />
        </div>
      </Modal>

      <Modal
        open={deleteOpen}
        title={t("ui.campaigns.deleteTitle")}
        onClose={() => setDeleteOpen(false)}
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              {t("ui.actions.close")}
            </Button>
            <Button
              variant="destructive"
              disabled={anyPending}
              onClick={async () => {
                setMessage("");
                try {
                  await deleteMutation.mutateAsync();
                  setDeleteOpen(false);
                  router.push("/campaigns");
                } catch (error) {
                  setMessage(error instanceof Error ? error.message : t("ui.feedback.requestFailed"));
                }
              }}
            >
              {t("ui.actions.confirmDelete")}
            </Button>
          </>
        }
      >
        <div className="text-sm">{t("ui.campaigns.deleteConfirm")}</div>
      </Modal>

      <Modal
        open={inviteOpen}
        title={t("ui.campaignDetail.invite")}
        onClose={() => setInviteOpen(false)}
        footer={
          <>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>
              {t("ui.actions.close")}
            </Button>
            <Button
              disabled={anyPending || !inviteUserId}
              onClick={async () => {
                setMessage("");
                try {
                  await inviteMutation.mutateAsync(inviteUserId);
                  setInviteOpen(false);
                  setInviteUserId("");
                  setMessage(t("ui.feedback.sent"));
                } catch (error) {
                  setMessage(error instanceof Error ? error.message : t("ui.feedback.requestFailed"));
                }
              }}
            >
              {t("ui.actions.invite")}
            </Button>
          </>
        }
      >
        <FormSelect
          value={inviteUserId}
          onChange={(event) => setInviteUserId(event.target.value)}
        >
          <option value="">{t("ui.campaignDetail.selectUser")}</option>
          {inviteCandidates.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.username}
            </option>
          ))}
        </FormSelect>
      </Modal>

      <Modal
        open={assignOpen}
        title={t("ui.campaignDetail.assignCharacter")}
        onClose={() => setAssignOpen(false)}
        footer={
          <>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>
              {t("ui.actions.close")}
            </Button>
            <Button
              disabled={anyPending || !assignCharacterId}
              onClick={async () => {
                setMessage("");
                try {
                  await assignMutation.mutateAsync(assignCharacterId);
                  setAssignOpen(false);
                  setAssignCharacterId("");
                  setMessage(t("ui.feedback.saved"));
                } catch (error) {
                  setMessage(error instanceof Error ? error.message : t("ui.feedback.requestFailed"));
                }
              }}
            >
              {t("ui.actions.assign")}
            </Button>
          </>
        }
      >
        <FormSelect
          value={assignCharacterId}
          onChange={(event) => setAssignCharacterId(event.target.value)}
        >
          <option value="">{t("ui.campaignDetail.selectCharacter")}</option>
          {assignableCharacters.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.name} ({entry.type})
            </option>
          ))}
        </FormSelect>
      </Modal>

      <Modal
        open={joinOpen}
        title={t("ui.campaignDetail.requestJoin")}
        onClose={() => setJoinOpen(false)}
        footer={
          <>
            <Button variant="outline" onClick={() => setJoinOpen(false)}>
              {t("ui.actions.close")}
            </Button>
            <Button
              disabled={anyPending}
              onClick={async () => {
                setMessage("");
                try {
                  await joinMutation.mutateAsync();
                  setJoinOpen(false);
                  setMessage(t("ui.feedback.sent"));
                } catch (error) {
                  setMessage(error instanceof Error ? error.message : t("ui.feedback.requestFailed"));
                }
              }}
            >
              {t("ui.actions.confirm")}
            </Button>
          </>
        }
      >
        <div className="text-sm">{t("ui.campaignDetail.joinConfirm")}</div>
      </Modal>
    </div>
  );
}
