"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Modal } from "@/components/common/modal";
import { AppHeader } from "@/components/common/app-header";
import { useCharacterDetailScreen } from "@/features/characters/hooks/use-character-detail-screen";
import type { OutgoingRelationship, RelationshipDetail } from "@/features/relationships/types";
import { getTranslator, type AppLocale } from "@/lib/i18n/index";
import { useClientSession } from "@/lib/client/use-client-session";

type CharacterDetailScreenProps = {
  locale: AppLocale;
  characterId: string;
};

type RelationshipTargetMode = "existing" | "external";

const fieldClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";

export function CharacterDetailPageView({ locale, characterId }: CharacterDetailScreenProps) {
  const t = useMemo(() => getTranslator(locale), [locale]);
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
  const [addForm, setAddForm] = useState({
    targetCharacterId: "",
    targetSnapshotName: "",
    categoryId: "",
    labelPresetId: "",
    labelCustom: "",
    description: "",
    firstTimelineEntry: "",
  });

  const [editMode, setEditMode] = useState<RelationshipTargetMode>("existing");
  const [editRelation, setEditRelation] = useState<OutgoingRelationship | null>(null);
  const [editForm, setEditForm] = useState({
    targetCharacterId: "",
    targetSnapshotName: "",
    categoryId: "",
    labelPresetId: "",
    labelCustom: "",
    description: "",
  });

  const [deleteRelation, setDeleteRelation] = useState<OutgoingRelationship | null>(null);
  const [detailContent, setDetailContent] = useState<RelationshipDetail | null>(null);

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
          <Card>
            <CardContent className="py-8 text-sm text-muted-foreground">
              {t("ui.start.loading")}
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const queryError = detailQuery.error instanceof Error ? detailQuery.error.message : "";
  const feedback = message || queryError;

  const { me, character, campaigns, allCharacters, catalog, summary, outgoing } = detailQuery.data;
  const isOwner = me.user.id === character.owner_user_id;
  const avatarUrl = avatarQuery.data ?? null;
  const assignedCampaign = campaigns.find((entry) => entry.id === character.campaign_id) ?? null;
  const defaultCategoryId = catalog.categories[0] ? String(catalog.categories[0].id) : "";
  const defaultLabelPresetId = catalog.labels[0] ? String(catalog.labels[0].id) : "";

  const campaignCharacters = character.campaign_id
    ? allCharacters.filter(
        (entry) => entry.campaign_id === character.campaign_id && entry.id !== character.id,
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
      outgoing.find((relation) => relation.target_character_id === entry.other_character_id) ??
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

  function openEditRelationship(relation: OutgoingRelationship) {
    setEditRelation(relation);
    const mode: RelationshipTargetMode = relation.target_character_id ? "existing" : "external";
    setEditMode(mode);
    setEditForm({
      targetCharacterId: relation.target_character_id ?? "",
      targetSnapshotName: relation.target_snapshot_name ?? "",
      categoryId: String(relation.category_id),
      labelPresetId: relation.label_preset_id ? String(relation.label_preset_id) : "",
      labelCustom: relation.label_custom ?? "",
      description: relation.description,
    });
    setEditRelationshipOpen(true);
  }

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
    <div className="min-h-screen bg-[linear-gradient(130deg,oklch(0.96_0.04_76),oklch(0.98_0.01_180)_40%,oklch(0.95_0.05_138))]">
      <AppHeader locale={locale} session={session} />
      <main className="mx-auto w-full max-w-7xl px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>{character.name}</CardTitle>
            <CardDescription>{t("ui.characterDetail.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-[200px_1fr]">
              <div className="overflow-hidden rounded-lg border border-border bg-muted/30">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={character.name}
                    width={200}
                    height={200}
                    className="h-[200px] w-full object-cover"
                  />
                ) : (
                  <div className="flex h-[200px] items-center justify-center text-xs text-muted-foreground">
                    {t("ui.characterDetail.noImage")}
                  </div>
                )}
              </div>
              <div className="space-y-2 text-sm">
                <div>
                  <strong>{t("ui.fields.characterName")}</strong>: {character.name}
                </div>
                <div>
                  <strong>{t("ui.fields.characterAge")}</strong>: {character.age ?? "-"}
                </div>
                <div>
                  <strong>{t("ui.fields.type")}</strong>: {character.type}
                </div>
                <div>
                  <strong>{t("ui.characterDetail.assignedCampaign")}</strong>:{" "}
                  {assignedCampaign?.title ?? "-"}
                </div>
                <div>
                  <strong>{t("ui.fields.description")}</strong>: {character.description || "-"}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {isOwner && !character.campaign_id ? (
                <Button variant="outline" onClick={() => setAssignOpen(true)}>
                  {t("ui.characterDetail.assignCampaign")}
                </Button>
              ) : null}
              {isOwner && character.campaign_id ? (
                <Button variant="outline" onClick={() => setUnassignOpen(true)}>
                  {t("ui.characterDetail.removeFromCampaign")}
                </Button>
              ) : null}
              {isOwner ? (
                <Button asChild variant="outline">
                  <Link href={`/characters/${character.id}/edit`}>{t("ui.actions.edit")}</Link>
                </Button>
              ) : null}
              {isOwner && character.campaign_id ? (
                <Button variant="outline" onClick={() => setAddRelationshipOpen(true)}>
                  {t("ui.characterDetail.addRelationship")}
                </Button>
              ) : null}
            </div>

            {feedback ? (
              <div className="rounded-md border border-border bg-background p-2 text-xs">
                {feedback}
              </div>
            ) : null}

            <div className="space-y-2">
              <div className="text-sm font-medium">{t("ui.characterDetail.relationships")}</div>
              {mergedRelations.map((entry, index) => (
                <div
                  key={`${entry.other_character_id ?? `external-${index}`}`}
                  className="grid gap-2 rounded-lg border border-border bg-background/70 p-3 md:grid-cols-[1fr_auto]"
                >
                  <button
                    className="text-left"
                    onClick={async () => {
                      setMessage("");
                      try {
                        const detail = await relationshipDetailMutation.mutateAsync({
                          otherCharacterId: entry.other_character_id,
                          outgoingRelationshipId: entry.outgoingRelation?.id,
                        });
                        setDetailContent(detail);
                        setRelationshipDetailOpen(true);
                      } catch (error) {
                        setMessage(
                          error instanceof Error ? error.message : t("ui.feedback.requestFailed"),
                        );
                      }
                    }}
                  >
                    <div className="font-medium">{entry.other_character_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {entry.other_character_deleted ? t("ui.characterDetail.externalOneWay") : ""}
                    </div>
                  </button>
                  <div className="flex flex-wrap gap-2">
                    {isOwner && entry.outgoingRelation ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (!entry.outgoingRelation) {
                              return;
                            }
                            openEditRelationship(entry.outgoingRelation);
                          }}
                        >
                          {t("ui.actions.edit")}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            if (!entry.outgoingRelation) {
                              return;
                            }
                            setDeleteRelation(entry.outgoingRelation);
                            setDeleteRelationshipOpen(true);
                          }}
                        >
                          {t("ui.actions.delete")}
                        </Button>
                      </>
                    ) : null}
                  </div>
                </div>
              ))}
              {mergedRelations.length === 0 ? (
                <div className="rounded-md border border-border bg-background p-3 text-xs text-muted-foreground">
                  {t("ui.feedback.empty")}
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </main>

      <Modal
        open={assignOpen}
        title={t("ui.characterDetail.assignCampaign")}
        onClose={() => setAssignOpen(false)}
        footer={
          <>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>
              {t("ui.actions.close")}
            </Button>
            <Button
              disabled={anyPending || !selectedCampaignId}
              onClick={async () => {
                setMessage("");
                try {
                  await assignMutation.mutateAsync(selectedCampaignId);
                  setAssignOpen(false);
                  setSelectedCampaignId("");
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
        <select
          className={fieldClass}
          value={selectedCampaignId}
          onChange={(event) => setSelectedCampaignId(event.target.value)}
        >
          <option value="">{t("ui.characterDetail.selectCampaign")}</option>
          {campaigns.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.title}
            </option>
          ))}
        </select>
      </Modal>

      <Modal
        open={unassignOpen}
        title={t("ui.characterDetail.removeFromCampaign")}
        onClose={() => setUnassignOpen(false)}
        footer={
          <>
            <Button variant="outline" onClick={() => setUnassignOpen(false)}>
              {t("ui.actions.close")}
            </Button>
            <Button
              variant="destructive"
              disabled={anyPending}
              onClick={async () => {
                setMessage("");
                try {
                  await unassignMutation.mutateAsync();
                  setUnassignOpen(false);
                  setMessage(t("ui.feedback.saved"));
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
        <div className="space-y-2 text-sm">
          <div>{t("ui.characterDetail.unassignConfirm")}</div>
          <div className="text-xs text-muted-foreground">{t("ui.characterDetail.unassignInfo")}</div>
        </div>
      </Modal>

      <Modal
        open={addRelationshipOpen}
        title={t("ui.characterDetail.addRelationship")}
        onClose={() => setAddRelationshipOpen(false)}
        footer={
          <>
            <Button variant="outline" onClick={() => setAddRelationshipOpen(false)}>
              {t("ui.actions.close")}
            </Button>
            <Button
              disabled={anyPending}
              onClick={async () => {
                setMessage("");
                try {
                  await createRelationshipMutation.mutateAsync({
                    sourceCharacterId: character.id,
                    targetCharacterId: addMode === "existing" ? addForm.targetCharacterId : null,
                    targetSnapshotName: addMode === "external" ? addForm.targetSnapshotName : null,
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
                  setMessage(error instanceof Error ? error.message : t("ui.feedback.requestFailed"));
                }
              }}
            >
              {t("ui.actions.create")}
            </Button>
          </>
        }
      >
        <div className="grid gap-2">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={addMode === "existing" ? "default" : "outline"}
              onClick={() => setAddMode("existing")}
            >
              {t("ui.characterDetail.targetExisting")}
            </Button>
            <Button
              size="sm"
              variant={addMode === "external" ? "default" : "outline"}
              onClick={() => setAddMode("external")}
            >
              {t("ui.characterDetail.targetExternal")}
            </Button>
          </div>

          {addMode === "existing" ? (
            <select
              className={fieldClass}
              value={addForm.targetCharacterId}
              onChange={(event) =>
                setAddForm((prev) => ({ ...prev, targetCharacterId: event.target.value }))
              }
            >
              <option value="">{t("ui.characterDetail.selectRelationshipTarget")}</option>
              {relationshipTargetOptions.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name}
                </option>
              ))}
            </select>
          ) : (
            <input
              className={fieldClass}
              value={addForm.targetSnapshotName}
              placeholder={t("ui.characterDetail.externalName")}
              onChange={(event) =>
                setAddForm((prev) => ({ ...prev, targetSnapshotName: event.target.value }))
              }
            />
          )}

          <select
            className={fieldClass}
            value={addForm.categoryId || defaultCategoryId}
            onChange={(event) => setAddForm((prev) => ({ ...prev, categoryId: event.target.value }))}
          >
            <option value="">{t("ui.characterDetail.category")}</option>
            {catalog.categories.map((entry) => (
              <option key={entry.id} value={String(entry.id)}>
                {entry.key}
              </option>
            ))}
          </select>

          <select
            className={fieldClass}
            value={addForm.labelPresetId || defaultLabelPresetId}
            onChange={(event) =>
              setAddForm((prev) => ({
                ...prev,
                labelPresetId: event.target.value,
                labelCustom: "",
              }))
            }
          >
            <option value="">{t("ui.characterDetail.label")}</option>
            {catalog.labels.map((entry) => (
              <option key={entry.id} value={String(entry.id)}>
                {entry.key}
              </option>
            ))}
          </select>

          <input
            className={fieldClass}
            value={addForm.labelCustom}
            placeholder={t("ui.characterDetail.customLabel")}
            onChange={(event) =>
              setAddForm((prev) => ({
                ...prev,
                labelCustom: event.target.value,
                labelPresetId: "",
              }))
            }
          />

          <textarea
            className={`${fieldClass} min-h-20`}
            placeholder={t("ui.fields.description")}
            value={addForm.description}
            onChange={(event) => setAddForm((prev) => ({ ...prev, description: event.target.value }))}
          />

          <textarea
            className={`${fieldClass} min-h-20`}
            placeholder={t("ui.characterDetail.firstTimelineEntry")}
            value={addForm.firstTimelineEntry}
            onChange={(event) =>
              setAddForm((prev) => ({ ...prev, firstTimelineEntry: event.target.value }))
            }
          />
        </div>
      </Modal>

      <Modal
        open={editRelationshipOpen}
        title={t("ui.characterDetail.editRelationship")}
        onClose={() => {
          setEditRelationshipOpen(false);
          setEditRelation(null);
        }}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setEditRelationshipOpen(false);
                setEditRelation(null);
              }}
            >
              {t("ui.actions.close")}
            </Button>
            <Button
              disabled={anyPending || !editRelation}
              onClick={async () => {
                if (!editRelation) {
                  return;
                }

                setMessage("");
                try {
                  await updateRelationshipMutation.mutateAsync({
                    relationshipId: editRelation.id,
                    targetCharacterId: editMode === "existing" ? editForm.targetCharacterId : null,
                    targetSnapshotName: editMode === "external" ? editForm.targetSnapshotName : null,
                    categoryId: Number(editForm.categoryId),
                    labelPresetId: editForm.labelCustom ? null : Number(editForm.labelPresetId),
                    labelCustom: editForm.labelCustom || null,
                    description: editForm.description,
                  });
                  setEditRelationshipOpen(false);
                  setEditRelation(null);
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
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={editMode === "existing" ? "default" : "outline"}
              onClick={() => setEditMode("existing")}
            >
              {t("ui.characterDetail.targetExisting")}
            </Button>
            <Button
              size="sm"
              variant={editMode === "external" ? "default" : "outline"}
              onClick={() => setEditMode("external")}
            >
              {t("ui.characterDetail.targetExternal")}
            </Button>
          </div>

          {editMode === "existing" ? (
            <select
              className={fieldClass}
              value={editForm.targetCharacterId}
              onChange={(event) =>
                setEditForm((prev) => ({ ...prev, targetCharacterId: event.target.value }))
              }
            >
              <option value="">{t("ui.characterDetail.selectRelationshipTarget")}</option>
              {editTargetOptions.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name}
                </option>
              ))}
            </select>
          ) : (
            <input
              className={fieldClass}
              value={editForm.targetSnapshotName}
              placeholder={t("ui.characterDetail.externalName")}
              onChange={(event) =>
                setEditForm((prev) => ({ ...prev, targetSnapshotName: event.target.value }))
              }
            />
          )}

          <select
            className={fieldClass}
            value={editForm.categoryId}
            onChange={(event) => setEditForm((prev) => ({ ...prev, categoryId: event.target.value }))}
          >
            <option value="">{t("ui.characterDetail.category")}</option>
            {catalog.categories.map((entry) => (
              <option key={entry.id} value={String(entry.id)}>
                {entry.key}
              </option>
            ))}
          </select>

          <select
            className={fieldClass}
            value={editForm.labelPresetId}
            onChange={(event) =>
              setEditForm((prev) => ({
                ...prev,
                labelPresetId: event.target.value,
                labelCustom: "",
              }))
            }
          >
            <option value="">{t("ui.characterDetail.label")}</option>
            {catalog.labels.map((entry) => (
              <option key={entry.id} value={String(entry.id)}>
                {entry.key}
              </option>
            ))}
          </select>

          <input
            className={fieldClass}
            value={editForm.labelCustom}
            placeholder={t("ui.characterDetail.customLabel")}
            onChange={(event) =>
              setEditForm((prev) => ({
                ...prev,
                labelCustom: event.target.value,
                labelPresetId: "",
              }))
            }
          />

          <textarea
            className={`${fieldClass} min-h-20`}
            value={editForm.description}
            placeholder={t("ui.fields.description")}
            onChange={(event) => setEditForm((prev) => ({ ...prev, description: event.target.value }))}
          />
        </div>
      </Modal>

      <Modal
        open={deleteRelationshipOpen}
        title={t("ui.characterDetail.deleteRelationship")}
        onClose={() => {
          setDeleteRelationshipOpen(false);
          setDeleteRelation(null);
        }}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteRelationshipOpen(false);
                setDeleteRelation(null);
              }}
            >
              {t("ui.actions.close")}
            </Button>
            <Button
              variant="destructive"
              disabled={anyPending || !deleteRelation}
              onClick={async () => {
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
                  setMessage(error instanceof Error ? error.message : t("ui.feedback.requestFailed"));
                }
              }}
            >
              {t("ui.actions.confirmDelete")}
            </Button>
          </>
        }
      >
        <div className="text-sm">{t("ui.characterDetail.deleteRelationshipConfirm")}</div>
      </Modal>

      <Modal
        open={relationshipDetailOpen}
        title={t("ui.characterDetail.relationshipDetail")}
        onClose={() => {
          setRelationshipDetailOpen(false);
          setDetailContent(null);
        }}
        footer={
          <Button
            variant="outline"
            onClick={() => {
              setRelationshipDetailOpen(false);
              setDetailContent(null);
            }}
          >
            {t("ui.actions.close")}
          </Button>
        }
      >
        {detailContent ? (
          <div className="space-y-3 text-sm">
            <div className="rounded border border-border p-2">
              <div className="font-medium">{t("ui.characterDetail.howThisSeesOther")}</div>
              <pre className="mt-1 overflow-auto whitespace-pre-wrap text-xs">
                {JSON.stringify(detailContent.outgoing, null, 2)}
              </pre>
            </div>
            <div className="rounded border border-border p-2">
              <div className="font-medium">{t("ui.characterDetail.howOtherSeesThis")}</div>
              <pre className="mt-1 overflow-auto whitespace-pre-wrap text-xs">
                {JSON.stringify(detailContent.incoming, null, 2)}
              </pre>
            </div>
            <div className="rounded border border-border p-2">
              <div className="font-medium">{t("ui.characterDetail.timeline")}</div>
              <pre className="mt-1 overflow-auto whitespace-pre-wrap text-xs">
                {JSON.stringify(detailContent.timeline, null, 2)}
              </pre>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
