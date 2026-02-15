"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AppHeader } from "@/components/common/app-header";
import { Modal } from "@/components/common/modal";
import { useClientSession } from "@/lib/client/use-client-session";
import { getTranslator, type AppLocale } from "@/lib/i18n/index";
import type { Character } from "@/features/characters/types";
import { useCharactersScreen } from "@/features/characters/hooks/use-characters-screen";

type CharactersScreenProps = {
  locale: AppLocale;
};

const fieldClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";

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
  const characters = charactersQuery.data ?? [];

  if (!ready || !session) {
    return <main className="min-h-screen" />;
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

            {message ? (
              <div className="rounded-md border border-border bg-background p-2 text-xs">
                {message}
              </div>
            ) : null}

            <div className="space-y-2">
              {characters.map((character) => (
                <div
                  key={character.id}
                  className="grid gap-2 rounded-lg border border-border bg-background/70 p-3 md:grid-cols-[1fr_auto]"
                >
                  <Link className="text-left" href={`/characters/${character.id}`}>
                    <div className="font-medium">{character.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {character.type} {character.campaign_id ? `- ${character.campaign_id}` : ""}
                    </div>
                  </Link>
                  <div className="flex flex-wrap gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/characters/${character.id}/edit`}>{t("ui.actions.edit")}</Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setDeleteTarget(character)}
                    >
                      {t("ui.actions.delete")}
                    </Button>
                  </div>
                </div>
              ))}
              {characters.length === 0 ? (
                <div className="rounded-lg border border-border bg-background/70 p-3 text-xs text-muted-foreground">
                  {t("ui.feedback.empty")}
                </div>
              ) : null}
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
                    });
                    setCreateOpen(false);
                    setCreateForm({ type: "player", name: "", age: "", description: "" });
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
          <select
            className={fieldClass}
            value={createForm.type}
            onChange={(event) =>
              setCreateForm((prev) => ({ ...prev, type: event.target.value }))
            }
          >
            <option value="player">player</option>
            <option value="npc">npc</option>
          </select>
          <input
            className={fieldClass}
            placeholder={t("ui.fields.characterName")}
            value={createForm.name}
            onChange={(event) =>
              setCreateForm((prev) => ({ ...prev, name: event.target.value }))
            }
          />
          <input
            className={fieldClass}
            placeholder={t("ui.fields.characterAge")}
            value={createForm.age}
            onChange={(event) =>
              setCreateForm((prev) => ({ ...prev, age: event.target.value }))
            }
          />
          <textarea
            className={`${fieldClass} min-h-24`}
            placeholder={t("ui.fields.description")}
            value={createForm.description}
            onChange={(event) =>
              setCreateForm((prev) => ({ ...prev, description: event.target.value }))
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
