"use client";

import { UiDiv } from "@/components/ui/html-elements";
import { AppPageMain, PageViewport } from "@/components/ui/page-shell";
import { TextLink } from "@/components/ui/text-link";

import { type ChangeEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { ConfirmAlertDialog } from "@/components/ui/confirm-alert-dialog";
import {
  FormInput,
  FormSelect,
  FormTextarea,
} from "@/components/ui/form-controls";
import {
  IconActionButton,
  IconActionLinkButton,
} from "@/components/ui/icon-action-button";
import ListControls from "@/components/ui/list-controls";
import { ListItemRow } from "@/components/ui/list-item-row";
import { Modal } from "@/components/ui/modal";
import { PageLoadingState } from "@/components/ui/page-loading-state";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { TitleWithPrivacy } from "@/components/ui/title-with-privacy";
import { VisibilityToggle } from "@/components/ui/visibility-toggle";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CharacterTypeBadge } from "@/features/characters/components/character-type-badge";
import { useCampaignsQuery } from "@/features/campaigns/hooks/use-campaigns-query";
import {
  type CharacterListSort,
  searchCharacters,
  sortCharacters,
} from "@/features/characters/logic/character-list.logic";
import type { Character } from "@/features/characters/types";
import { useCharactersScreen } from "@/features/characters/hooks/use-characters-screen";
import { useMeQuery } from "@/features/users/hooks/use-me-query";
import useClientSession from "@/lib/client/use-client-session";
import { type AppLocale, getTranslator } from "@/lib/i18n/index";
import {
  clampListPage,
  DEFAULT_LIST_PAGE_SIZE,
  paginateListItems,
} from "@/lib/utils/list";

type CharactersScreenProps = {
  locale: AppLocale;
};

const CharactersPageView = ({ locale }: CharactersScreenProps) => {
  const t = getTranslator(locale);
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
  const campaignsQuery = useCampaignsQuery(session);

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

  const campaignsById = new Map(
    (campaignsQuery.data?.campaigns ?? []).map((campaign) => [
      campaign.id,
      campaign,
    ]),
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

  const handleOpenCreate = () => {
    setCreateOpen(true);
  };

  const handleCloseCreate = () => {
    setCreateOpen(false);
  };

  const handleSortChange = (value: string) => {
    setSortBy(value as CharacterListSort);
  };

  const resetCreateForm = () => {
    setCreateForm({
      type: "player",
      name: "",
      age: "",
      description: "",
      isPrivate: false,
    });
  };

  const handleCreateCharacter = async () => {
    try {
      await createMutation.mutateAsync({
        type: createForm.type as "player" | "npc",
        name: createForm.name,
        age: createForm.age ? Number(createForm.age) : null,
        description: createForm.description,
        isPrivate: createForm.isPrivate,
      });
      setCreateOpen(false);
      resetCreateForm();
      setMessage(t("ui.feedback.created"));
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : t("ui.feedback.requestFailed"),
      );
    }
  };

  const handleDeleteDialogOpenChange = (open: boolean) => {
    if (!open) {
      setDeleteTarget(null);
    }
  };

  const handleDeleteCharacter = async () => {
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
  };

  const handleCreateTypeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setCreateForm((prev) => ({ ...prev, type: event.target.value }));
  };

  const handleCreateNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setCreateForm((prev) => ({ ...prev, name: event.target.value }));
  };

  const handleCreateAgeChange = (event: ChangeEvent<HTMLInputElement>) => {
    setCreateForm((prev) => ({ ...prev, age: event.target.value }));
  };

  const handleCreateDescriptionChange = (
    event: ChangeEvent<HTMLTextAreaElement>,
  ) => {
    setCreateForm((prev) => ({
      ...prev,
      description: event.target.value,
    }));
  };

  const handleCreatePrivacyToggle = () => {
    setCreateForm((prev) => ({ ...prev, isPrivate: !prev.isPrivate }));
  };

  if (!ready || !session) {
    return <PageViewport />;
  }

  if (meQuery.isLoading) {
    return (
      <AppPageMain maxWidth="7xl">
        <PageLoadingState label={t("ui.loading.page")} />
      </AppPageMain>
    );
  }

  return (
    <>
      <AppPageMain maxWidth="7xl">
        <Card>
          <CardHeader>
            <CardTitle>{t("ui.characters.title")}</CardTitle>
            <CardDescription>{t("ui.characters.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent stack={4}>
            <UiDiv wrapGap={2}>
              <Button onClick={handleOpenCreate}>
                {t("ui.characters.create")}
              </Button>
            </UiDiv>

            <FeedbackMessage message={feedback} />

            <ListControls
              searchValue={searchQuery}
              onSearchChange={setSearchQuery}
              searchPlaceholder={t("ui.list.searchCharacters")}
              sortValue={sortBy}
              onSortChange={handleSortChange}
              sortLabel={t("ui.list.sortBy")}
              sortOptions={sortOptions}
            />

            <UiDiv stack={2}>
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
                    <UiDiv stack={1}>
                      <TextLink href={`/characters/${character.id}`}>
                        <TitleWithPrivacy
                          title={character.name}
                          isPrivate={character.is_private}
                          weight="medium"
                        />
                      </TextLink>
                      <UiDiv wrapGap={2} contentAlign="center">
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
      </AppPageMain>

      <Modal
        open={createOpen}
        title={t("ui.characters.create")}
        onClose={handleCloseCreate}
        footer={
          <>
            <Button variant="outline" onClick={handleCloseCreate}>
              {t("ui.actions.close")}
            </Button>
            <Button
              disabled={anyPending}
              onClick={() => void handleCreateCharacter()}
            >
              {t("ui.actions.create")}
            </Button>
          </>
        }
      >
        <UiDiv gridGap={2}>
          <FormSelect value={createForm.type} onChange={handleCreateTypeChange}>
            <option value="player">
              {t("ui.labels.characterType.player")}
            </option>
            <option value="npc">{t("ui.labels.characterType.npc")}</option>
          </FormSelect>
          <FormInput
            placeholder={t("ui.fields.characterName")}
            value={createForm.name}
            onChange={handleCreateNameChange}
          />
          <FormInput
            placeholder={t("ui.fields.characterAge")}
            value={createForm.age}
            onChange={handleCreateAgeChange}
          />
          <FormTextarea
            size="lg"
            placeholder={t("ui.fields.description")}
            value={createForm.description}
            onChange={handleCreateDescriptionChange}
          />
          <VisibilityToggle
            isPrivate={createForm.isPrivate}
            label={t("ui.fields.visibilityPrivate")}
            onLabel={t("ui.actions.on")}
            offLabel={t("ui.actions.off")}
            onToggle={handleCreatePrivacyToggle}
          />
        </UiDiv>
      </Modal>

      <ConfirmAlertDialog
        open={deleteTarget !== null}
        title={t("ui.characters.deleteTitle")}
        description={t("ui.characters.deleteConfirm")}
        cancelLabel={t("ui.actions.close")}
        confirmLabel={t("ui.actions.confirmDelete")}
        confirmDisabled={anyPending || !deleteTarget}
        onOpenChange={handleDeleteDialogOpenChange}
        onConfirm={handleDeleteCharacter}
      />
    </>
  );
};

export default CharactersPageView;
