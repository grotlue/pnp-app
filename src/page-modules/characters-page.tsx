"use client";

import { UiDiv, UiMain } from "@/components/ui/html-elements";
import { TextLink } from "@/components/ui/text-link";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Pencil, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";
import { FeedbackMessage } from "@/components/common/feedback-message";
import {
  FormInput,
  FormSelect,
  FormTextarea,
} from "@/components/common/form-controls";
import {
  IconActionButton,
  IconActionLinkButton,
} from "@/components/common/icon-action-button";
import { ListControls } from "@/components/common/list-controls";
import { ListItemRow } from "@/components/common/list-item-row";
import { Modal } from "@/components/common/modal";
import { PageLoadingState } from "@/components/common/page-loading-state";
import { PaginationControls } from "@/components/common/pagination-controls";
import { TitleWithPrivacy } from "@/components/common/title-with-privacy";
import { VisibilityToggle } from "@/components/common/visibility-toggle";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CharacterTypeBadge } from "@/features/characters/components/character-type-badge";
import {
  type CharacterListSort,
  searchCharacters,
  sortCharacters,
} from "@/features/characters/logic/character-list.logic";
import type { Character } from "@/features/characters/types";
import { useCharactersScreen } from "@/features/characters/hooks/use-characters-screen";
import { getCampaignsQuery } from "@/features/campaigns/queries/get-campaigns.query";
import { useMeQuery } from "@/features/users/hooks/use-me-query";
import { queryKeys } from "@/lib/client/query-keys";
import { useClientSession } from "@/lib/client/use-client-session";
import { getTranslator, type AppLocale } from "@/lib/i18n/index";
import {
  clampListPage,
  DEFAULT_LIST_PAGE_SIZE,
  paginateListItems,
} from "@/lib/utils/list";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<CharacterListSort>("updated_desc");
  const [page, setPage] = useState(1);

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

  const { charactersQuery, createMutation, deleteMutation, anyPending } =
    useCharactersScreen(session);

  const meQuery = useMeQuery(session);

  const campaignsQuery = useQuery({
    queryKey: queryKeys.campaignsScreen(session?.accessToken ?? "no-session"),
    enabled: Boolean(session),
    queryFn: async () => {
      if (!session) {
        throw new Error("Missing session");
      }

      return getCampaignsQuery(session, { scope: "member" });
    },
  });

  const characters = charactersQuery.data ?? [];
  const visibleCharacters = characters;
  const sortedAndFilteredCharacters = sortCharacters(
    searchCharacters(visibleCharacters, searchQuery),
    sortBy,
  );
  const safePage = clampListPage(
    page,
    sortedAndFilteredCharacters.length,
    DEFAULT_LIST_PAGE_SIZE,
  );
  const pagedCharacters = paginateListItems(
    sortedAndFilteredCharacters,
    safePage,
    DEFAULT_LIST_PAGE_SIZE,
  );

  const campaignsById = useMemo(
    () =>
      new Map(
        (campaignsQuery.data ?? []).map((campaign) => [campaign.id, campaign]),
      ),
    [campaignsQuery.data],
  );

  const queryError = [
    charactersQuery.error,
    meQuery.error,
    campaignsQuery.error,
  ].find((entry) => entry instanceof Error);
  const feedback =
    message || (queryError instanceof Error ? queryError.message : "");

  const sortOptions = [
    { value: "updated_desc", label: t("ui.list.sortUpdated") },
    { value: "created_desc", label: t("ui.list.sortCreated") },
    { value: "name_asc", label: t("ui.list.sortName") },
  ];

  if (!ready || !session) {
    return <UiMain className="min-h-screen" />;
  }

  if (meQuery.isLoading) {
    return (
      <UiDiv className="min-h-screen bg-[linear-gradient(130deg,oklch(0.96_0.04_76),oklch(0.98_0.01_180)_40%,oklch(0.95_0.05_138))]">
        <UiMain className="mx-auto w-full max-w-7xl px-4 py-8">
          <PageLoadingState label={t("ui.loading.page")} />
        </UiMain>
      </UiDiv>
    );
  }

  return (
    <UiDiv className="min-h-screen bg-[linear-gradient(130deg,oklch(0.96_0.04_76),oklch(0.98_0.01_180)_40%,oklch(0.95_0.05_138))]">
      <UiMain className="mx-auto w-full max-w-7xl px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>{t("ui.characters.title")}</CardTitle>
            <CardDescription>{t("ui.characters.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <UiDiv className="flex flex-wrap gap-2">
              <Button onClick={() => setCreateOpen(true)}>
                {t("ui.characters.create")}
              </Button>
            </UiDiv>

            <FeedbackMessage message={feedback} />

            <ListControls
              searchValue={searchQuery}
              onSearchChange={setSearchQuery}
              searchPlaceholder={t("ui.list.searchCharacters")}
              sortValue={sortBy}
              onSortChange={(value) => setSortBy(value as CharacterListSort)}
              sortLabel={t("ui.list.sortBy")}
              sortOptions={sortOptions}
            />

            <UiDiv className="space-y-2">
              {pagedCharacters.map((character) => {
                const campaign = character.campaign_id
                  ? (campaignsById.get(character.campaign_id) ?? null)
                  : null;

                return (
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
                    <UiDiv className="space-y-1">
                      <TextLink href={`/characters/${character.id}`}>
                        <TitleWithPrivacy
                          title={character.name}
                          isPrivate={character.is_private}
                          className="font-medium"
                        />
                      </TextLink>
                      <UiDiv className="flex flex-wrap items-center gap-2">
                        <CharacterTypeBadge type={character.type} t={t} />
                        {campaign ? (
                          <TextLink
                            href={`/campaigns/${campaign.id}`}
                            size="xs"
                          >
                            {campaign.title}
                          </TextLink>
                        ) : null}
                      </UiDiv>
                    </UiDiv>
                  </ListItemRow>
                );
              })}
              {sortedAndFilteredCharacters.length === 0 ? (
                <EmptyState label={t("ui.feedback.empty")} />
              ) : null}
            </UiDiv>

            <PaginationControls
              page={safePage}
              pageSize={DEFAULT_LIST_PAGE_SIZE}
              totalItems={sortedAndFilteredCharacters.length}
              previousLabel={t("ui.list.previous")}
              nextLabel={t("ui.list.next")}
              pageLabel={t("ui.list.page")}
              onPageChange={setPage}
            />
          </CardContent>
        </Card>
      </UiMain>

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
                      error instanceof Error
                        ? error.message
                        : t("ui.feedback.requestFailed"),
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
        <UiDiv className="grid gap-2">
          <FormSelect
            value={createForm.type}
            onChange={(event) =>
              setCreateForm((prev) => ({ ...prev, type: event.target.value }))
            }
          >
            <option value="player">
              {t("ui.labels.characterType.player")}
            </option>
            <option value="npc">{t("ui.labels.characterType.npc")}</option>
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
              setCreateForm((prev) => ({
                ...prev,
                description: event.target.value,
              }))
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
        </UiDiv>
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
        <UiDiv className="text-sm">{t("ui.characters.deleteConfirm")}</UiDiv>
      </Modal>
    </UiDiv>
  );
}
