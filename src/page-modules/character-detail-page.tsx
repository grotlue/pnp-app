"use client";

import { UiDiv } from "@/components/ui/html-elements";
import { AppPageMain, PageViewport } from "@/components/ui/page-shell";
import { TextLink } from "@/components/ui/text-link";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { IconActionButton } from "@/components/ui/icon-action-button";
import { ListItemRow } from "@/components/ui/list-item-row";
import { PageLoadingState } from "@/components/ui/page-loading-state";
import { Button } from "@/components/ui/button";
import { AvatarImage } from "@/components/ui/avatar-image";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AddRelationshipModal,
  AssignCampaignModal,
  DeleteRelationshipModal,
  EditRelationshipModal,
  type RelationshipAddFormValues,
  RelationshipDetailModal,
  type RelationshipEditFormValues,
  type RelationshipTargetMode,
  UnassignCampaignModal,
} from "@/page-modules/character-detail-modals";
import { TitleWithPrivacy } from "@/components/ui/title-with-privacy";
import { CharacterTypeBadge } from "@/features/characters/components/character-type-badge";
import { useCharacterDetailScreen } from "@/features/characters/hooks/use-character-detail-screen";
import { canManageCharacter, isAdmin } from "@/features/users/logic/role.logic";
import type {
  OutgoingRelationship,
  RelationshipDetail,
} from "@/features/relationships/types";
import { type AppLocale, getTranslator } from "@/lib/i18n/index";
import useClientSession from "@/lib/client/use-client-session";

type CharacterDetailScreenProps = {
  locale: AppLocale;
  characterId: string;
};

const CharacterDetailPageView = ({
  locale,
  characterId,
}: CharacterDetailScreenProps) => {
  const t = getTranslator(locale);
  const router = useRouter();
  const { session, ready } = useClientSession();
  const {
    detailQuery,
    avatarQuery,
    assignMutation,
    unassignMutation,
    createRelationshipMutation,
    updateRelationshipMutation,
    deleteRelationshipMutation,
    relationshipDetailMutation,
    anyPending,
  } = useCharacterDetailScreen(session, characterId);

  const [message, setMessage] = useState("");
  const [assignOpen, setAssignOpen] = useState(false);
  const [unassignOpen, setUnassignOpen] = useState(false);
  const [addRelationshipOpen, setAddRelationshipOpen] = useState(false);
  const [editRelationshipOpen, setEditRelationshipOpen] = useState(false);
  const [deleteRelationshipOpen, setDeleteRelationshipOpen] = useState(false);
  const [relationshipDetailOpen, setRelationshipDetailOpen] = useState(false);

  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const [addMode, setAddMode] = useState<RelationshipTargetMode>("existing");
  const [addForm, setAddForm] = useState<RelationshipAddFormValues>({
    targetCharacterId: "",
    targetSnapshotName: "",
    categoryId: "",
    labelPresetId: "",
    labelCustom: "",
    description: "",
    firstTimelineEntry: "",
  });

  const [editMode, setEditMode] = useState<RelationshipTargetMode>("existing");
  const [editRelation, setEditRelation] = useState<OutgoingRelationship | null>(
    null,
  );
  const [editForm, setEditForm] = useState<RelationshipEditFormValues>({
    targetCharacterId: "",
    targetSnapshotName: "",
    categoryId: "",
    labelPresetId: "",
    labelCustom: "",
    description: "",
  });

  const [deleteRelation, setDeleteRelation] =
    useState<OutgoingRelationship | null>(null);
  const [detailContent, setDetailContent] = useState<RelationshipDetail | null>(
    null,
  );

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
      <AppPageMain maxWidth="7xl">
        <PageLoadingState label={t("ui.loading.page")} />
      </AppPageMain>
    );
  }

  const queryError =
    detailQuery.error instanceof Error ? detailQuery.error.message : "";
  const feedback = message || queryError;

  const {
    me,
    character,
    campaigns,
    allCharacters,
    users,
    catalog,
    summary,
    outgoing,
  } = detailQuery.data;
  const isOwner = me.user.id === character.owner_user_id;
  const canManage = canManageCharacter({
    isOwner,
    role: me.profile.role,
    isPrivate: character.is_private,
  });
  const isForeignAdminView = isAdmin(me.profile.role) && !isOwner;
  const avatarUrl = avatarQuery.data ?? null;
  const assignedCampaign =
    campaigns.find((entry) => entry.id === character.campaign_id) ?? null;
  const ownerUser =
    users.find((entry) => entry.id === character.owner_user_id) ?? null;
  const defaultCategoryId = catalog.categories[0]
    ? String(catalog.categories[0].id)
    : "";
  const defaultLabelPresetId = catalog.labels[0]
    ? String(catalog.labels[0].id)
    : "";

  const campaignCharacters = character.campaign_id
    ? allCharacters.filter(
        (entry) =>
          entry.campaign_id === character.campaign_id &&
          entry.id !== character.id,
      )
    : [];

  const existingTargetIds = new Set(
    outgoing
      .map((entry) => entry.target_character_id)
      .filter((value): value is string => Boolean(value)),
  );
  const relationshipTargetOptions = campaignCharacters.filter(
    (entry) => !existingTargetIds.has(entry.id),
  );

  const mergedRelations = summary.map((entry) => {
    const outgoingRelation =
      outgoing.find(
        (relation) => relation.target_character_id === entry.other_character_id,
      ) ??
      (entry.other_character_id === null
        ? outgoing.find(
            (relation) =>
              relation.target_character_id === null &&
              relation.target_name === entry.other_character_name,
          )
        : null) ??
      null;

    return {
      ...entry,
      outgoingRelation,
    };
  });

  const openEditRelationship = (relation: OutgoingRelationship) => {
    setEditRelation(relation);
    const mode: RelationshipTargetMode = relation.target_character_id
      ? "existing"
      : "external";
    setEditMode(mode);
    setEditForm({
      targetCharacterId: relation.target_character_id ?? "",
      targetSnapshotName: relation.target_snapshot_name ?? "",
      categoryId: String(relation.category_id),
      labelPresetId: relation.label_preset_id
        ? String(relation.label_preset_id)
        : "",
      labelCustom: relation.label_custom ?? "",
      description: relation.description,
    });
    setEditRelationshipOpen(true);
  };

  const editTargetOptions = editRelation?.target_character_id
    ? [
        ...relationshipTargetOptions,
        ...campaignCharacters.filter(
          (entry) =>
            entry.id === editRelation.target_character_id &&
            !relationshipTargetOptions.some((option) => option.id === entry.id),
        ),
      ]
    : relationshipTargetOptions;

  return (
    <>
      <AppPageMain maxWidth="7xl">
        <Card>
          <CardHeader>
            <CardTitle>
              <TitleWithPrivacy
                title={character.name}
                isPrivate={character.is_private}
                iconClassName="size-4"
              />
            </CardTitle>
            <CardDescription>
              {t("ui.characterDetail.subtitle")}
            </CardDescription>
            {isForeignAdminView ? (
              <UiDiv surface="danger-chip">
                {t("ui.admin.foreignItemLabel")}
              </UiDiv>
            ) : null}
          </CardHeader>
          <CardContent stack={4}>
            <UiDiv gridPreset="character-detail">
              <UiDiv surface="avatar-frame">
                {avatarUrl ? (
                  <AvatarImage src={avatarUrl} alt={character.name} />
                ) : (
                  <AspectRatio ratio={1}>
                    <UiDiv surface="avatar-fallback">
                      {t("ui.characterDetail.noImage")}
                    </UiDiv>
                  </AspectRatio>
                )}
              </UiDiv>
              <UiDiv stack={2} textStyle="sm">
                <UiDiv>
                  <strong>{t("ui.fields.characterName")}</strong>:{" "}
                  {character.name}
                </UiDiv>
                <UiDiv>
                  <strong>{t("ui.fields.characterAge")}</strong>:{" "}
                  {character.age ?? "-"}
                </UiDiv>
                <UiDiv>
                  <strong>{t("ui.fields.type")}</strong>:{" "}
                  <CharacterTypeBadge type={character.type} t={t} />
                </UiDiv>
                <UiDiv>
                  <strong>{t("ui.admin.ownerLabel")}</strong>:{" "}
                  {ownerUser?.role === "admin" ? (
                    <span>{ownerUser.username ?? character.owner_user_id}</span>
                  ) : (
                    <TextLink href={`/users/${character.owner_user_id}`}>
                      {ownerUser?.username ?? character.owner_user_id}
                    </TextLink>
                  )}
                </UiDiv>
                <UiDiv>
                  <strong>{t("ui.characterDetail.assignedCampaign")}</strong>:{" "}
                  {assignedCampaign ? (
                    <TextLink href={`/campaigns/${assignedCampaign.id}`}>
                      {assignedCampaign.title}
                    </TextLink>
                  ) : (
                    "-"
                  )}
                </UiDiv>
                <UiDiv>
                  <strong>{t("ui.fields.description")}</strong>:{" "}
                  {character.description || "-"}
                </UiDiv>
              </UiDiv>
            </UiDiv>

            <UiDiv wrapGap={2}>
              {canManage && !character.campaign_id ? (
                <Button variant="outline" onClick={() => setAssignOpen(true)}>
                  {t("ui.characterDetail.assignCampaign")}
                </Button>
              ) : null}
              {canManage && character.campaign_id ? (
                <Button variant="outline" onClick={() => setUnassignOpen(true)}>
                  {t("ui.characterDetail.removeFromCampaign")}
                </Button>
              ) : null}
              {canManage ? (
                <Button asChild variant="outline">
                  <Link href={`/characters/${character.id}/edit`}>
                    {t("ui.actions.edit")}
                  </Link>
                </Button>
              ) : null}
              {canManage && character.campaign_id ? (
                <Button
                  variant="outline"
                  onClick={() => setAddRelationshipOpen(true)}
                >
                  {t("ui.characterDetail.addRelationship")}
                </Button>
              ) : null}
            </UiDiv>

            <FeedbackMessage message={feedback} />

            <UiDiv stack={2}>
              <UiDiv textStyle="sm-medium">
                {t("ui.characterDetail.relationships")}
              </UiDiv>
              {mergedRelations.map((entry, index) => (
                <ListItemRow
                  key={`${entry.other_character_id ?? `external-${index}`}`}
                  actions={
                    canManage && entry.outgoingRelation ? (
                      <>
                        <IconActionButton
                          label={t("ui.actions.edit")}
                          icon={Pencil}
                          onClick={() => {
                            if (!entry.outgoingRelation) {
                              return;
                            }
                            openEditRelationship(entry.outgoingRelation);
                          }}
                        />
                        <IconActionButton
                          label={t("ui.actions.delete")}
                          icon={Trash2}
                          variant="destructive"
                          onClick={() => {
                            if (!entry.outgoingRelation) {
                              return;
                            }
                            setDeleteRelation(entry.outgoingRelation);
                            setDeleteRelationshipOpen(true);
                          }}
                        />
                      </>
                    ) : null
                  }
                >
                  <Button
                    variant="ghost-row"
                    onClick={async () => {
                      setMessage("");
                      try {
                        const detail =
                          await relationshipDetailMutation.mutateAsync({
                            otherCharacterId: entry.other_character_id,
                            outgoingRelationshipId: entry.outgoingRelation?.id,
                          });
                        setDetailContent(detail);
                        setRelationshipDetailOpen(true);
                      } catch (error) {
                        setMessage(
                          error instanceof Error
                            ? error.message
                            : t("ui.feedback.requestFailed"),
                        );
                      }
                    }}
                  >
                    <UiDiv textStyle="medium">
                      {entry.other_character_name}
                    </UiDiv>
                    <UiDiv textStyle="muted-xs">
                      {entry.other_character_deleted
                        ? t("ui.characterDetail.externalOneWay")
                        : ""}
                    </UiDiv>
                  </Button>
                </ListItemRow>
              ))}
              {mergedRelations.length === 0 ? (
                <EmptyState label={t("ui.feedback.empty")} variant="panel" />
              ) : null}
            </UiDiv>
          </CardContent>
        </Card>
      </AppPageMain>

      <AssignCampaignModal
        t={t}
        open={assignOpen}
        anyPending={anyPending}
        selectedCampaignId={selectedCampaignId}
        campaigns={campaigns}
        onClose={() => setAssignOpen(false)}
        onSelectedCampaignIdChange={setSelectedCampaignId}
        onAssign={async () => {
          setMessage("");
          try {
            await assignMutation.mutateAsync(selectedCampaignId);
            setAssignOpen(false);
            setSelectedCampaignId("");
            setMessage(t("ui.feedback.saved"));
          } catch (error) {
            setMessage(
              error instanceof Error
                ? error.message
                : t("ui.feedback.requestFailed"),
            );
          }
        }}
      />

      <UnassignCampaignModal
        t={t}
        open={unassignOpen}
        anyPending={anyPending}
        onClose={() => setUnassignOpen(false)}
        onConfirm={async () => {
          setMessage("");
          try {
            await unassignMutation.mutateAsync();
            setUnassignOpen(false);
            setMessage(t("ui.feedback.saved"));
          } catch (error) {
            setMessage(
              error instanceof Error
                ? error.message
                : t("ui.feedback.requestFailed"),
            );
          }
        }}
      />

      <AddRelationshipModal
        t={t}
        open={addRelationshipOpen}
        anyPending={anyPending}
        mode={addMode}
        form={addForm}
        targetOptions={relationshipTargetOptions}
        catalog={catalog}
        defaultCategoryId={defaultCategoryId}
        defaultLabelPresetId={defaultLabelPresetId}
        onClose={() => setAddRelationshipOpen(false)}
        onModeChange={setAddMode}
        onFormChange={setAddForm}
        onCreate={async () => {
          setMessage("");
          try {
            await createRelationshipMutation.mutateAsync({
              sourceCharacterId: character.id,
              targetCharacterId:
                addMode === "existing" ? addForm.targetCharacterId : null,
              targetSnapshotName:
                addMode === "external" ? addForm.targetSnapshotName : null,
              categoryId: Number(addForm.categoryId || defaultCategoryId),
              labelPresetId: addForm.labelCustom
                ? null
                : Number(addForm.labelPresetId || defaultLabelPresetId),
              labelCustom: addForm.labelCustom || null,
              description: addForm.description,
              firstTimelineEntry: addForm.firstTimelineEntry,
            });
            setAddRelationshipOpen(false);
            setAddMode("existing");
            setAddForm({
              targetCharacterId: "",
              targetSnapshotName: "",
              categoryId: addForm.categoryId || defaultCategoryId,
              labelPresetId: addForm.labelPresetId || defaultLabelPresetId,
              labelCustom: "",
              description: "",
              firstTimelineEntry: "",
            });
            setMessage(t("ui.feedback.created"));
          } catch (error) {
            setMessage(
              error instanceof Error
                ? error.message
                : t("ui.feedback.requestFailed"),
            );
          }
        }}
      />

      <EditRelationshipModal
        t={t}
        open={editRelationshipOpen}
        anyPending={anyPending}
        hasRelation={Boolean(editRelation)}
        mode={editMode}
        form={editForm}
        targetOptions={editTargetOptions}
        catalog={catalog}
        onClose={() => {
          setEditRelationshipOpen(false);
          setEditRelation(null);
        }}
        onModeChange={setEditMode}
        onFormChange={setEditForm}
        onSave={async () => {
          if (!editRelation) {
            return;
          }
          setMessage("");
          try {
            await updateRelationshipMutation.mutateAsync({
              relationshipId: editRelation.id,
              targetCharacterId:
                editMode === "existing" ? editForm.targetCharacterId : null,
              targetSnapshotName:
                editMode === "external" ? editForm.targetSnapshotName : null,
              categoryId: Number(editForm.categoryId),
              labelPresetId: editForm.labelCustom
                ? null
                : Number(editForm.labelPresetId),
              labelCustom: editForm.labelCustom || null,
              description: editForm.description,
            });
            setEditRelationshipOpen(false);
            setEditRelation(null);
            setMessage(t("ui.feedback.saved"));
          } catch (error) {
            setMessage(
              error instanceof Error
                ? error.message
                : t("ui.feedback.requestFailed"),
            );
          }
        }}
      />

      <DeleteRelationshipModal
        t={t}
        open={deleteRelationshipOpen}
        anyPending={anyPending}
        hasRelation={Boolean(deleteRelation)}
        onClose={() => {
          setDeleteRelationshipOpen(false);
          setDeleteRelation(null);
        }}
        onDelete={async () => {
          if (!deleteRelation) {
            return;
          }
          setMessage("");
          try {
            await deleteRelationshipMutation.mutateAsync(deleteRelation.id);
            setDeleteRelationshipOpen(false);
            setDeleteRelation(null);
            setMessage(t("ui.feedback.deleted"));
          } catch (error) {
            setMessage(
              error instanceof Error
                ? error.message
                : t("ui.feedback.requestFailed"),
            );
          }
        }}
      />

      <RelationshipDetailModal
        t={t}
        open={relationshipDetailOpen}
        detail={detailContent}
        onClose={() => {
          setRelationshipDetailOpen(false);
          setDetailContent(null);
        }}
      />
    </>
  );
};

export default CharacterDetailPageView;
