"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FeedbackMessage } from "@/components/common/feedback-message";
import {
  FormInput,
  FormSelect,
  FormTextarea,
} from "@/components/common/form-controls";
import { ImageUploadField } from "@/components/common/image-upload-field";
import { Modal } from "@/components/common/modal";
import { VisibilityToggle } from "@/components/common/visibility-toggle";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createCharacterAvatarSignedUpload } from "@/features/characters/queries/character-edit.query";
import { getCharacterAvatarSignedUrl } from "@/features/characters/queries/character-detail.query";
import { uploadImageToSignedPath } from "@/lib/client/storage-upload";
import { useClientSession } from "@/lib/client/use-client-session";
import { getTranslator, type AppLocale } from "@/lib/i18n/index";
import { useCharacterEditScreen } from "@/features/characters/hooks/use-character-edit-screen";
import { canManageCharacter, isAdmin } from "@/features/users/logic/role.logic";

type CharacterEditScreenProps = {
  locale: AppLocale;
  characterId: string;
};

export function CharacterEditPageView({
  locale,
  characterId,
}: CharacterEditScreenProps) {
  const t = useMemo(() => getTranslator(locale), [locale]);
  const router = useRouter();
  const { session, ready } = useClientSession();

  const [message, setMessage] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [formEdits, setFormEdits] = useState<{
    name?: string;
    age?: string;
    type?: "player" | "npc";
    avatarPath?: string;
    description?: string;
    isPrivate?: boolean;
  }>({});

  useEffect(() => {
    if (!ready) {
      return;
    }
    if (!session) {
      router.replace("/");
    }
  }, [ready, router, session]);

  const { editQuery, updateMutation, deleteMutation, anyPending } =
    useCharacterEditScreen(session, characterId);

  const uploadCharacterImage = useCallback(
    async (file: File, dimensions: { width: number; height: number }) => {
      if (!session) {
        throw new Error("Missing session");
      }

      const signedUpload = await createCharacterAvatarSignedUpload(
        session,
        characterId,
        {
          fileName: file.name,
          width: dimensions.width,
          height: dimensions.height,
          fileSize: file.size,
        },
      );
      await uploadImageToSignedPath({
        bucket: "character-images",
        path: signedUpload.path,
        token: signedUpload.token,
        file,
      });

      return { path: signedUpload.path };
    },
    [characterId, session],
  );

  const resolveCharacterImagePreview = useCallback(
    async (path: string) => {
      if (!session) {
        throw new Error("Missing session");
      }

      const response = await getCharacterAvatarSignedUrl(session, path);
      return response.signedUrl;
    },
    [session],
  );

  if (!ready || !session || !editQuery.data) {
    return <main className="min-h-screen" />;
  }

  const character = editQuery.data.character;
  const form = {
    name: formEdits.name ?? character.name,
    age: formEdits.age ?? (character.age ? String(character.age) : ""),
    type: formEdits.type ?? character.type,
    avatarPath: formEdits.avatarPath ?? character.avatar_path ?? "",
    description: formEdits.description ?? character.description,
    isPrivate: formEdits.isPrivate ?? character.is_private ?? false,
  };

  const isOwner = editQuery.data.me.user.id === character.owner_user_id;
  const canManage = canManageCharacter({
    isOwner,
    role: editQuery.data.me.profile.role,
    isPrivate: character.is_private,
  });
  const isForeignAdminView =
    isAdmin(editQuery.data.me.profile.role) && !isOwner;
  if (!canManage) {
    return (
      <div className="min-h-screen bg-[linear-gradient(130deg,oklch(0.96_0.04_76),oklch(0.98_0.01_180)_40%,oklch(0.95_0.05_138))]">
        <main className="mx-auto w-full max-w-4xl px-4 py-8">
          <Card>
            <CardHeader>
              <CardTitle>{t("ui.feedback.requestFailed")}</CardTitle>
              <CardDescription>
                {t("ui.characterEdit.noPermission")}
              </CardDescription>
            </CardHeader>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(130deg,oklch(0.96_0.04_76),oklch(0.98_0.01_180)_40%,oklch(0.95_0.05_138))]">
      <main className="mx-auto w-full max-w-4xl px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>{t("ui.characterEdit.title")}</CardTitle>
            <CardDescription>{t("ui.characterEdit.subtitle")}</CardDescription>
            {isForeignAdminView ? (
              <div className="border-destructive/40 bg-destructive/10 text-destructive inline-flex w-fit rounded-md border px-2 py-1 text-xs font-medium">
                {t("ui.admin.foreignItemLabel")}
              </div>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-3">
            <FormInput
              value={form.name}
              placeholder={t("ui.fields.characterName")}
              onChange={(event) =>
                setFormEdits((prev) => ({ ...prev, name: event.target.value }))
              }
            />
            <FormInput
              value={form.age}
              placeholder={t("ui.fields.characterAge")}
              onChange={(event) =>
                setFormEdits((prev) => ({ ...prev, age: event.target.value }))
              }
            />
            <FormSelect
              value={form.type}
              onChange={(event) =>
                setFormEdits((prev) => ({
                  ...prev,
                  type: event.target.value as "player" | "npc",
                }))
              }
            >
              <option value="player">
                {t("ui.labels.characterType.player")}
              </option>
              <option value="npc">{t("ui.labels.characterType.npc")}</option>
            </FormSelect>
            <ImageUploadField
              value={form.avatarPath}
              label={t("ui.fields.characterImage")}
              previewAlt={form.name || t("ui.fields.characterImage")}
              hint={t("ui.imageUpload.hint")}
              emptyLabel={t("ui.imageUpload.empty")}
              uploadLabel={t("ui.imageUpload.upload")}
              replaceLabel={t("ui.imageUpload.replace")}
              removeLabel={t("ui.imageUpload.remove")}
              uploadingLabel={t("ui.imageUpload.uploading")}
              invalidTypeLabel={t("ui.imageUpload.invalidType")}
              invalidDimensionsLabel={t("ui.imageUpload.invalidDimensions")}
              invalidFileSizeLabel={t("ui.imageUpload.invalidFileSize")}
              disabled={anyPending}
              onChange={(avatarPath) =>
                setFormEdits((prev) => ({ ...prev, avatarPath }))
              }
              onUpload={uploadCharacterImage}
              onResolvePreviewUrl={resolveCharacterImagePreview}
            />
            <FormTextarea
              className="min-h-24"
              value={form.description}
              placeholder={t("ui.fields.description")}
              onChange={(event) =>
                setFormEdits((prev) => ({
                  ...prev,
                  description: event.target.value,
                }))
              }
            />
            <VisibilityToggle
              isPrivate={form.isPrivate}
              label={t("ui.fields.visibilityPrivate")}
              onLabel={t("ui.actions.on")}
              offLabel={t("ui.actions.off")}
              onToggle={() =>
                setFormEdits((prev) => ({
                  ...prev,
                  isPrivate: !form.isPrivate,
                }))
              }
            />

            <div className="flex flex-wrap gap-2">
              <Button
                disabled={anyPending}
                onClick={() =>
                  void (async () => {
                    try {
                      await updateMutation.mutateAsync({
                        name: form.name,
                        age: form.age ? Number(form.age) : null,
                        type: form.type as "player" | "npc",
                        avatarPath: form.avatarPath || null,
                        description: form.description,
                        isPrivate: form.isPrivate,
                      });
                      setMessage(t("ui.feedback.saved"));
                      router.push(`/characters/${character.id}`);
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

              <Button
                variant="outline"
                onClick={() => router.push(`/characters/${character.id}`)}
              >
                {t("ui.actions.close")}
              </Button>

              <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
                {t("ui.actions.delete")}
              </Button>
            </div>

            <FeedbackMessage message={message} />
          </CardContent>
        </Card>
      </main>

      <Modal
        open={deleteOpen}
        title={t("ui.characters.deleteTitle")}
        onClose={() => setDeleteOpen(false)}
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              {t("ui.actions.close")}
            </Button>
            <Button
              variant="destructive"
              disabled={anyPending}
              onClick={() =>
                void (async () => {
                  try {
                    await deleteMutation.mutateAsync();
                    setDeleteOpen(false);
                    router.push("/characters");
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
        <div className="text-sm">{t("ui.characters.deleteConfirm")}</div>
      </Modal>
    </div>
  );
}
