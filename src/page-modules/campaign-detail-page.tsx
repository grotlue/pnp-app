"use client";

import { UiDiv } from "@/components/ui/html-elements";
import {
  AppPageBackground,
  AppPageMain,
  PageViewport,
} from "@/components/ui/page-shell";
import { TextLink } from "@/components/ui/text-link";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/ui/empty-state";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import {
  FormInput,
  FormSelect,
  FormTextarea,
} from "@/components/ui/form-controls";
import { SectionBox } from "@/components/ui/section-box";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { PageLoadingState } from "@/components/ui/page-loading-state";
import { ToggleTabs } from "@/components/ui/toggle-tabs";
import { TitleWithPrivacy } from "@/components/ui/title-with-privacy";
import { VisibilityToggle } from "@/components/ui/visibility-toggle";
import { useCampaignDetailScreen } from "@/features/campaigns/hooks/use-campaign-detail-screen";
import { canManageCampaign, isAdmin } from "@/features/users/logic/role.logic";
import { getTranslator, type AppLocale } from "@/lib/i18n/index";
import { useClientSession } from "@/lib/client/use-client-session";

type CampaignDetailScreenProps = {
  locale: AppLocale;
  campaignId: string;
};

export function CampaignDetailPageView({
  locale,
  campaignId,
}: CampaignDetailScreenProps) {
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
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    isPrivate: false,
  });
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
    return <PageViewport />;
  }

  if (detailQuery.isLoading || !detailQuery.data) {
    return (
      <AppPageBackground>
        <AppPageMain maxWidth="7xl">
          <PageLoadingState label={t("ui.loading.page")} />
        </AppPageMain>
      </AppPageBackground>
    );
  }

  const queryError =
    detailQuery.error instanceof Error ? detailQuery.error.message : "";
  const feedback = message || queryError;

  const { me, detail, characters, users } = detailQuery.data;
  const isOwner = detail.campaign.owner_user_id === me.user.id;
  const canManage = canManageCampaign({
    isOwner,
    role: me.profile.role,
    isPrivate: detail.campaign.is_private,
  });
  const isForeignAdminView = isAdmin(me.profile.role) && !isOwner;
  const ownMembership = detail.memberships.find(
    (entry) => entry.user_id === me.user.id,
  );
  const canRequestJoin =
    !canManage && (!ownMembership || ownMembership.state === "rejected");
  const hasPendingJoinRequest =
    !canManage &&
    ownMembership?.source === "request" &&
    ownMembership.state === "pending";

  const acceptedPlayers = detail.memberships.filter(
    (entry) => entry.state === "accepted",
  );
  const campaignCharacters = characters.filter(
    (entry) => entry.campaign_id === campaignId,
  );
  const playerCharacters = campaignCharacters.filter(
    (entry) => entry.type === "player",
  );
  const npcCharacters = campaignCharacters.filter(
    (entry) => entry.type === "npc",
  );

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

  const membershipUserIds = new Set(
    detail.memberships.map((entry) => entry.user_id),
  );
  const inviteCandidates = users.filter(
    (entry) =>
      entry.id !== detail.campaign.owner_user_id &&
      !membershipUserIds.has(entry.id),
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
    <AppPageBackground>
      <AppPageMain maxWidth="7xl">
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
              <UiDiv surface="danger-chip">
                {t("ui.admin.foreignItemLabel")}
              </UiDiv>
            ) : null}
          </CardHeader>
          <CardContent stack={4}>
            <UiDiv wrapGap={2}>
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
                  <Button
                    variant="destructive"
                    onClick={() => setDeleteOpen(true)}
                  >
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
            </UiDiv>

            <FeedbackMessage message={feedback} />
            <FeedbackMessage
              message={
                hasPendingJoinRequest ? t("ui.campaignDetail.joinPending") : ""
              }
            />

            <SectionBox
              title={t("ui.fields.campaignDescription")}
              textStyle="sm"
            >
              <UiDiv textStyle="muted" mt={1}>
                {detail.campaign.description || "-"}
              </UiDiv>
            </SectionBox>

            <SectionBox title={t("ui.campaignDetail.players")}>
              <UiDiv stack={1} textStyle="xs">
                {acceptedPlayers.map((entry) =>
                  isAdminUser(entry.user_id) ? (
                    <UiDiv key={entry.id}>{usernameFor(entry.user_id)}</UiDiv>
                  ) : (
                    <TextLink
                      key={entry.id}
                      href={`/users/${entry.user_id}`}
                      display="block"
                    >
                      {usernameFor(entry.user_id)}
                    </TextLink>
                  ),
                )}
                {acceptedPlayers.length === 0 ? (
                  <EmptyState label={t("ui.feedback.empty")} variant="ghost" />
                ) : null}
              </UiDiv>
            </SectionBox>

            {canManage && pendingRequests.length > 0 ? (
              <SectionBox title={t("ui.campaignDetail.pendingRequests")}>
                <UiDiv stack={2}>
                  {pendingRequests.map((entry) => (
                    <UiDiv key={entry.id} surface="pending-row">
                      {isAdminUser(entry.user_id) ? (
                        <span>{usernameFor(entry.user_id)}</span>
                      ) : (
                        <TextLink href={`/users/${entry.user_id}`}>
                          {usernameFor(entry.user_id)}
                        </TextLink>
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
                              error instanceof Error
                                ? error.message
                                : t("ui.feedback.requestFailed"),
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
                              error instanceof Error
                                ? error.message
                                : t("ui.feedback.requestFailed"),
                            );
                          }
                        }}
                      >
                        {t("ui.actions.reject")}
                      </Button>
                    </UiDiv>
                  ))}
                </UiDiv>
              </SectionBox>
            ) : null}

            <SectionBox>
              <UiDiv mb={2}>
                <ToggleTabs
                  value={tab}
                  onChange={setTab}
                  options={[
                    {
                      value: "player",
                      label: t("ui.campaignDetail.playerCharacters"),
                    },
                    { value: "npc", label: t("ui.campaignDetail.npcs") },
                  ]}
                />
              </UiDiv>
              <UiDiv stack={1} textStyle="xs">
                {(tab === "player" ? playerCharacters : npcCharacters).map(
                  (entry) => (
                    <TextLink
                      key={entry.id}
                      href={`/characters/${entry.id}`}
                      display="inline-flex"
                    >
                      <TitleWithPrivacy
                        title={entry.name}
                        isPrivate={entry.is_private}
                      />
                    </TextLink>
                  ),
                )}
                {(tab === "player" ? playerCharacters : npcCharacters)
                  .length === 0 ? (
                  <EmptyState label={t("ui.feedback.empty")} variant="ghost" />
                ) : null}
              </UiDiv>
            </SectionBox>
          </CardContent>
        </Card>
      </AppPageMain>

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
                  setMessage(
                    error instanceof Error
                      ? error.message
                      : t("ui.feedback.requestFailed"),
                  );
                }
              }}
            >
              {t("ui.actions.save")}
            </Button>
          </>
        }
      >
        <UiDiv gridGap={2}>
          <FormInput
            value={editForm.title}
            placeholder={t("ui.fields.campaignTitle")}
            onChange={(event) =>
              setEditForm((prev) => ({ ...prev, title: event.target.value }))
            }
          />
          <FormTextarea
            size="lg"
            value={editForm.description}
            placeholder={t("ui.fields.campaignDescription")}
            onChange={(event) =>
              setEditForm((prev) => ({
                ...prev,
                description: event.target.value,
              }))
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
        </UiDiv>
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
                  setMessage(
                    error instanceof Error
                      ? error.message
                      : t("ui.feedback.requestFailed"),
                  );
                }
              }}
            >
              {t("ui.actions.confirmDelete")}
            </Button>
          </>
        }
      >
        <UiDiv textStyle="sm">{t("ui.campaigns.deleteConfirm")}</UiDiv>
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
                  setMessage(
                    error instanceof Error
                      ? error.message
                      : t("ui.feedback.requestFailed"),
                  );
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
                  setMessage(
                    error instanceof Error
                      ? error.message
                      : t("ui.feedback.requestFailed"),
                  );
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
                  setMessage(
                    error instanceof Error
                      ? error.message
                      : t("ui.feedback.requestFailed"),
                  );
                }
              }}
            >
              {t("ui.actions.confirm")}
            </Button>
          </>
        }
      >
        <UiDiv textStyle="sm">{t("ui.campaignDetail.joinConfirm")}</UiDiv>
      </Modal>
    </AppPageBackground>
  );
}
