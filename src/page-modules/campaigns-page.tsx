"use client";

import { UiDiv } from "@/components/ui/html-elements";
import { AppPageMain, PageViewport } from "@/components/ui/page-shell";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { ListControls } from "@/components/ui/list-controls";
import { ConfirmAlertDialog } from "@/components/ui/confirm-alert-dialog";
import { Modal } from "@/components/ui/modal";
import { PageLoadingState } from "@/components/ui/page-loading-state";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useClientSession } from "@/lib/client/use-client-session";
import { getTranslator, type AppLocale } from "@/lib/i18n/index";
import {
  DEFAULT_LIST_PAGE_SIZE,
  clampListPage,
  paginateListItems,
} from "@/lib/utils/list";
import {
  type CampaignListSort,
  searchCampaigns,
  sortCampaigns,
} from "@/features/campaigns/logic/campaign-list.logic";
import { isCampaignOwner } from "@/features/campaigns/logic/campaign-role.logic";
import { useCampaignsQuery } from "@/features/campaigns/hooks/use-campaigns-query";
import { useCampaignMutations } from "@/features/campaigns/hooks/use-campaign-mutations";
import { CampaignForm } from "@/features/campaigns/components/campaign-form";
import { CampaignsList } from "@/features/campaigns/components/campaigns-list";
import type { Campaign, CampaignFormValues } from "@/features/campaigns/types";

type CampaignsPageViewProps = {
  locale: AppLocale;
};

const defaultFormValues: CampaignFormValues = {
  title: "",
  description: "",
  isPrivate: false,
};

export function CampaignsPageView({ locale }: CampaignsPageViewProps) {
  const t = useMemo(() => getTranslator(locale), [locale]);
  const router = useRouter();
  const { session, ready } = useClientSession();

  const [message, setMessage] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editCampaign, setEditCampaign] = useState<Campaign | null>(null);
  const [deleteCampaign, setDeleteCampaign] = useState<Campaign | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<CampaignListSort>("updated_desc");
  const [page, setPage] = useState(1);
  const [createForm, setCreateForm] =
    useState<CampaignFormValues>(defaultFormValues);
  const [editForm, setEditForm] =
    useState<CampaignFormValues>(defaultFormValues);

  useEffect(() => {
    if (!ready) {
      return;
    }
    if (!session) {
      router.replace("/");
    }
  }, [ready, router, session]);

  const campaignsQuery = useCampaignsQuery(session);
  const { createMutation, updateMutation, deleteMutation, anyPending } =
    useCampaignMutations(session);

  const queryError =
    campaignsQuery.error instanceof Error ? campaignsQuery.error.message : "";
  const feedback = message || queryError;
  const campaigns = campaignsQuery.data?.campaigns ?? [];
  const currentUserId = campaignsQuery.data?.me.user.id;
  const visibleCampaigns = campaigns;
  const sortedAndFilteredCampaigns = sortCampaigns(
    searchCampaigns(visibleCampaigns, searchQuery),
    sortBy,
  );
  const safePage = clampListPage(
    page,
    sortedAndFilteredCampaigns.length,
    DEFAULT_LIST_PAGE_SIZE,
  );
  const pagedCampaigns = paginateListItems(
    sortedAndFilteredCampaigns,
    safePage,
    DEFAULT_LIST_PAGE_SIZE,
  );

  const sortOptions = [
    { value: "updated_desc", label: t("ui.list.sortUpdated") },
    { value: "created_desc", label: t("ui.list.sortCreated") },
    { value: "name_asc", label: t("ui.list.sortName") },
  ];

  if (!ready || !session) {
    return <PageViewport />;
  }

  return (
    <>
      <AppPageMain maxWidth="7xl">
        <Card>
          <CardHeader>
            <CardTitle>{t("ui.campaigns.title")}</CardTitle>
            <CardDescription>{t("ui.campaigns.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent stack={4}>
            <UiDiv wrapGap={2}>
              <Button onClick={() => setCreateOpen(true)}>
                {t("ui.campaigns.create")}
              </Button>
            </UiDiv>

            <FeedbackMessage message={feedback} />

            <ListControls
              searchValue={searchQuery}
              onSearchChange={setSearchQuery}
              searchPlaceholder={t("ui.list.searchCampaigns")}
              sortValue={sortBy}
              onSortChange={(value) => setSortBy(value as CampaignListSort)}
              sortLabel={t("ui.list.sortBy")}
              sortOptions={sortOptions}
            />

            {campaignsQuery.isLoading ? (
              <PageLoadingState
                label={t("ui.loading.section")}
                density="compact"
              />
            ) : (
              <>
                <CampaignsList
                  campaigns={pagedCampaigns}
                  currentUserId={currentUserId}
                  ownerLabel={t("ui.labels.campaignRole.owner")}
                  playerLabel={t("ui.labels.campaignRole.player")}
                  editLabel={t("ui.actions.edit")}
                  deleteLabel={t("ui.actions.delete")}
                  emptyLabel={t("ui.feedback.empty")}
                  isOwner={isCampaignOwner}
                  canManage={(campaign, userId) =>
                    isCampaignOwner(campaign, userId) ||
                    campaignsQuery.data?.me.profile?.role === "admin"
                  }
                  onEdit={(campaign) => {
                    setEditCampaign(campaign);
                    setEditForm({
                      title: campaign.title,
                      description: campaign.description,
                      isPrivate: campaign.is_private ?? false,
                    });
                  }}
                  onDelete={setDeleteCampaign}
                />
                <PaginationControls
                  page={safePage}
                  pageSize={DEFAULT_LIST_PAGE_SIZE}
                  totalItems={sortedAndFilteredCampaigns.length}
                  previousLabel={t("ui.list.previous")}
                  nextLabel={t("ui.list.next")}
                  pageLabel={t("ui.list.page")}
                  onPageChange={setPage}
                />
              </>
            )}
          </CardContent>
        </Card>
      </AppPageMain>

      <Modal
        open={createOpen}
        title={t("ui.campaigns.create")}
        onClose={() => setCreateOpen(false)}
        footer={
          <>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              {t("ui.actions.close")}
            </Button>
            <Button
              disabled={anyPending}
              onClick={async () => {
                setMessage("");
                try {
                  await createMutation.mutateAsync(createForm);
                  setCreateOpen(false);
                  setCreateForm(defaultFormValues);
                  setMessage(t("ui.feedback.created"));
                } catch (error) {
                  setMessage(
                    error instanceof Error
                      ? error.message
                      : t("ui.feedback.requestFailed"),
                  );
                }
              }}
            >
              {t("ui.actions.create")}
            </Button>
          </>
        }
      >
        <CampaignForm
          values={createForm}
          onChange={setCreateForm}
          titlePlaceholder={t("ui.fields.campaignTitle")}
          descriptionPlaceholder={t("ui.fields.campaignDescription")}
          visibilityLabel={t("ui.fields.visibilityPrivate")}
          onLabel={t("ui.actions.on")}
          offLabel={t("ui.actions.off")}
        />
      </Modal>

      <Modal
        open={editCampaign !== null}
        title={t("ui.campaigns.edit")}
        onClose={() => setEditCampaign(null)}
        footer={
          <>
            <Button variant="outline" onClick={() => setEditCampaign(null)}>
              {t("ui.actions.close")}
            </Button>
            <Button
              disabled={anyPending || !editCampaign}
              onClick={async () => {
                if (!editCampaign) {
                  return;
                }

                setMessage("");
                try {
                  await updateMutation.mutateAsync({
                    campaignId: editCampaign.id,
                    values: editForm,
                  });
                  setEditCampaign(null);
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
        <CampaignForm
          values={editForm}
          onChange={setEditForm}
          titlePlaceholder={t("ui.fields.campaignTitle")}
          descriptionPlaceholder={t("ui.fields.campaignDescription")}
          visibilityLabel={t("ui.fields.visibilityPrivate")}
          onLabel={t("ui.actions.on")}
          offLabel={t("ui.actions.off")}
        />
      </Modal>

      <ConfirmAlertDialog
        open={deleteCampaign !== null}
        title={t("ui.campaigns.deleteTitle")}
        description={t("ui.campaigns.deleteConfirm")}
        cancelLabel={t("ui.actions.close")}
        confirmLabel={t("ui.actions.confirmDelete")}
        confirmDisabled={anyPending || !deleteCampaign}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteCampaign(null);
          }
        }}
        onConfirm={async () => {
          if (!deleteCampaign) {
            return;
          }

          setMessage("");
          try {
            await deleteMutation.mutateAsync(deleteCampaign.id);
            setDeleteCampaign(null);
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
    </>
  );
}
