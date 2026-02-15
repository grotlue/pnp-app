"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Pencil, Trash2 } from "lucide-react";
import { AppHeader } from "@/components/common/app-header";
import { EmptyState } from "@/components/common/empty-state";
import { FeedbackMessage } from "@/components/common/feedback-message";
import { FormInput, FormSelect, FormTextarea } from "@/components/common/form-controls";
import { IconActionButton, IconActionLinkButton } from "@/components/common/icon-action-button";
import { ListItemRow } from "@/components/common/list-item-row";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Modal } from "@/components/common/modal";
import { TitleWithPrivacy } from "@/components/common/title-with-privacy";
import { VisibilityToggle } from "@/components/common/visibility-toggle";
import { useClientSession } from "@/lib/client/use-client-session";
import { getTranslator, type AppLocale } from "@/lib/i18n/index";
import type { Character } from "@/features/characters/types";
import { useCharactersScreen } from "@/features/characters/hooks/use-characters-screen";
import { getMe } from "@/features/users/queries/users-profile.query";

type CharactersScreenProps = {
  locale: AppLocale;
};

export function CharactersPageView({ locale }: CharactersScreenProps) {
  const t = useMemo(() => getTranslator(locale), [locale]);
  const router = useRouter();
  const { session, ready } = useClientSession();

  const [message, setMessage] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Character | null>(null);

  const [createOpen, setCreateOpen] = useState(false);

  const [createForm, setCreateForm] = useState({
    type: "player",
    name: "",
    age: "",
    description: "",
    isPrivate: false,
  });
  useEffect(() => {
    if (!ready) {
      return;
    }
    if (!session) {
      router.replace("/");
    }
  }, [ready, router, session]);

  const { charactersQuery, createMutation, deleteMutation, anyPending } = useCharactersScreen(
    session,
  );
  const meQuery = useQuery({
    queryKey: ["me", "characters-screen", session?.accessToken ?? "no-session"],
    enabled: Boolean(session),
    queryFn: async () => {
      if (!session) {
        throw new Error("Missing session");
      }

      return getMe(session);
    },
  });
  const characters = charactersQuery.data ?? [];
  const meUserId = meQuery.data?.user.id;
  const visibleCharacters =
    meQuery.data?.profile.role === "admin"
      ? characters.filter((character) => character.owner_user_id === meUserId)
      : characters;

  if (!ready || !session) {
    return <main className="min-h-screen" />;
  }

  if (meQuery.isLoading) {
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

  return (
    <div className="min-h-screen bg-[linear-gradient(130deg,oklch(0.96_0.04_76),oklch(0.98_0.01_180)_40%,oklch(0.95_0.05_138))]">
      <AppHeader locale={locale} session={session} />
      <main className="mx-auto w-full max-w-7xl px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>{t("ui.characters.title")}</CardTitle>
            <CardDescription>{t("ui.characters.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setCreateOpen(true)}>
                {t("ui.characters.create")}
              </Button>
            </div>

            <FeedbackMessage message={message} />

            <div className="space-y-2">
              {visibleCharacters.map((character) => (
                <ListItemRow
                  key={character.id}
                  actions={
                    <>
                      <IconActionLinkButton
                        label={t("ui.actions.edit")}
                        icon={Pencil}
                        href={`/characters/${character.id}/edit`}
                      />
                      <IconActionButton
                        label={t("ui.actions.delete")}
                        icon={Trash2}
                        variant="destructive"
                        onClick={() => setDeleteTarget(character)}
                      />
                    </>
                  }
                >
                  <Link className="text-left" href={`/characters/${character.id}`}>
                    <TitleWithPrivacy
                      title={character.name}
                      isPrivate={character.is_private}
                      className="font-medium"
                    />
                    <div className="text-xs text-muted-foreground">
                      {character.type} {character.campaign_id ? `- ${character.campaign_id}` : ""}
                    </div>
                  </Link>
                </ListItemRow>
              ))}
              {visibleCharacters.length === 0 ? <EmptyState label={t("ui.feedback.empty")} /> : null}
            </div>
          </CardContent>
        </Card>
      </main>

      <Modal
        open={createOpen}
        title={t("ui.characters.create")}
        onClose={() => setCreateOpen(false)}
        footer={
          <>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              {t("ui.actions.close")}
            </Button>
            <Button
              disabled={anyPending}
              onClick={() =>
                void (async () => {
                  try {
                    await createMutation.mutateAsync({
                      type: createForm.type as "player" | "npc",
                      name: createForm.name,
                      age: createForm.age ? Number(createForm.age) : null,
                      description: createForm.description,
                      isPrivate: createForm.isPrivate,
                    });
                    setCreateOpen(false);
                    setCreateForm({
                      type: "player",
                      name: "",
                      age: "",
                      description: "",
                      isPrivate: false,
                    });
                    setMessage(t("ui.feedback.created"));
                  } catch (error) {
                    setMessage(
                      error instanceof Error ? error.message : t("ui.feedback.requestFailed"),
                    );
                    return;
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
          <FormSelect
            value={createForm.type}
            onChange={(event) =>
              setCreateForm((prev) => ({ ...prev, type: event.target.value }))
            }
          >
            <option value="player">player</option>
            <option value="npc">npc</option>
          </FormSelect>
          <FormInput
            placeholder={t("ui.fields.characterName")}
            value={createForm.name}
            onChange={(event) =>
              setCreateForm((prev) => ({ ...prev, name: event.target.value }))
            }
          />
          <FormInput
            placeholder={t("ui.fields.characterAge")}
            value={createForm.age}
            onChange={(event) =>
              setCreateForm((prev) => ({ ...prev, age: event.target.value }))
            }
          />
          <FormTextarea
            className="min-h-24"
            placeholder={t("ui.fields.description")}
            value={createForm.description}
            onChange={(event) =>
              setCreateForm((prev) => ({ ...prev, description: event.target.value }))
            }
          />
          <VisibilityToggle
            isPrivate={createForm.isPrivate}
            label={t("ui.fields.visibilityPrivate")}
            onLabel={t("ui.actions.on")}
            offLabel={t("ui.actions.off")}
            onToggle={() =>
              setCreateForm((prev) => ({ ...prev, isPrivate: !prev.isPrivate }))
            }
          />
        </div>
      </Modal>

      <Modal
        open={deleteTarget !== null}
        title={t("ui.characters.deleteTitle")}
        onClose={() => setDeleteTarget(null)}
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              {t("ui.actions.close")}
            </Button>
            <Button
              variant="destructive"
              disabled={anyPending || !deleteTarget}
              onClick={() =>
                void (async () => {
                  if (!deleteTarget) {
                    return;
                  }

                  try {
                    await deleteMutation.mutateAsync(deleteTarget.id);
                    setDeleteTarget(null);
                    setMessage(t("ui.feedback.deleted"));
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
