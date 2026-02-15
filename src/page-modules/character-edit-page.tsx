"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Modal } from "@/components/common/modal";
import { AppHeader } from "@/components/common/app-header";
import { useClientSession } from "@/lib/client/use-client-session";
import { getTranslator, type AppLocale } from "@/lib/i18n/index";
import { useCharacterEditScreen } from "@/features/characters/hooks/use-character-edit-screen";

type CharacterEditScreenProps = {
  locale: AppLocale;
  characterId: string;
};

const fieldClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";

export function CharacterEditPageView({ locale, characterId }: CharacterEditScreenProps) {
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
  }>({});

  useEffect(() => {
    if (!ready) {
      return;
    }
    if (!session) {
      router.replace("/");
    }
  }, [ready, router, session]);

  const { editQuery, updateMutation, deleteMutation, anyPending } = useCharacterEditScreen(
    session,
    characterId,
  );

  if (!ready || !session || !editQuery.data) {
    return <main className="min-h-screen" />;
  }

  const character = editQuery.data.character;
  const form = {
    name: formEdits.name ?? character.name,
    age: formEdits.age ?? (character.age ? String(character.age) : ""),
    type: formEdits.type ?? character.type,
    avatarPath: formEdits.avatarPath ?? (character.avatar_path ?? ""),
    description: formEdits.description ?? character.description,
  };

  const isOwner = editQuery.data.me.user.id === character.owner_user_id;
  if (!isOwner) {
    return (
      <div className="min-h-screen bg-[linear-gradient(130deg,oklch(0.96_0.04_76),oklch(0.98_0.01_180)_40%,oklch(0.95_0.05_138))]">
        <AppHeader locale={locale} session={session} />
        <main className="mx-auto w-full max-w-4xl px-4 py-8">
          <Card>
            <CardHeader>
              <CardTitle>{t("ui.feedback.requestFailed")}</CardTitle>
              <CardDescription>{t("ui.characterEdit.noPermission")}</CardDescription>
            </CardHeader>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(130deg,oklch(0.96_0.04_76),oklch(0.98_0.01_180)_40%,oklch(0.95_0.05_138))]">
      <AppHeader locale={locale} session={session} />
      <main className="mx-auto w-full max-w-4xl px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>{t("ui.characterEdit.title")}</CardTitle>
            <CardDescription>{t("ui.characterEdit.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <input
              className={fieldClass}
              value={form.name}
              placeholder={t("ui.fields.characterName")}
              onChange={(event) =>
                setFormEdits((prev) => ({ ...prev, name: event.target.value }))
              }
            />
            <input
              className={fieldClass}
              value={form.age}
              placeholder={t("ui.fields.characterAge")}
              onChange={(event) =>
                setFormEdits((prev) => ({ ...prev, age: event.target.value }))
              }
            />
            <select
              className={fieldClass}
              value={form.type}
              onChange={(event) =>
                setFormEdits((prev) => ({
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
              value={form.avatarPath}
              placeholder={t("ui.characterEdit.avatarPath")}
              onChange={(event) =>
                setFormEdits((prev) => ({ ...prev, avatarPath: event.target.value }))
              }
            />
            <textarea
              className={`${fieldClass} min-h-24`}
              value={form.description}
              placeholder={t("ui.fields.description")}
              onChange={(event) =>
                setFormEdits((prev) => ({ ...prev, description: event.target.value }))
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
                      });
                      setMessage(t("ui.feedback.saved"));
                      router.push(`/characters/${character.id}`);
                    } catch (error) {
                      setMessage(
                        error instanceof Error ? error.message : t("ui.feedback.requestFailed"),
                      );
                    }
                  })()
                }
              >
                {t("ui.actions.save")}
              </Button>

              <Button variant="outline" onClick={() => router.push(`/characters/${character.id}`)}>
                {t("ui.actions.close")}
              </Button>

              <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
                {t("ui.actions.delete")}
              </Button>
            </div>

            {message ? (
              <div className="rounded-md border border-border bg-background p-2 text-xs">
                {message}
              </div>
            ) : null}
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
                      error instanceof Error ? error.message : t("ui.feedback.requestFailed"),
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
