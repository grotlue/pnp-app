"use client";

import { UiDiv } from "@/components/ui/html-elements";
import { AppPageMain, PageViewport } from "@/components/ui/page-shell";

import { useEffect, useState } from "react";
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
import { type AppLocale, getTranslator } from "@/lib/i18n/index";
import {
  clampListPage,
  DEFAULT_LIST_PAGE_SIZE,
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

const CampaignsPageView = ({ locale }: CampaignsPageViewProps) => {
  const t = getTranslator(locale);
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
  const isAdmin = campaignsQuery.data?.me.profile?.role === "admin";

  const handleOpenCreate = () => {
    setCreateOpen(true);
  };

  const handleCloseCreate = () => {
    setCreateOpen(false);
  };

  const handleCloseEdit = () => {
    setEditCampaign(null);
  };

  const handleSortChange = (value: string) => {
    setSortBy(value as CampaignListSort);
  };

  const handleCanManageCampaign = (campaign: Campaign, userId?: string) => {
    return isCampaignOwner(campaign, userId) || isAdmin;
  };

  const handleEditCampaign = (campaign: Campaign) => {
    setEditCampaign(campaign);
    setEditForm({
      title: campaign.title,
      description: campaign.description,
      isPrivate: campaign.is_private ?? false,
    });
  };

  const handleCreateCampaign = async () => {
    setMessage("");
    try {
      await createMutation.mutateAsync(createForm);
      setCreateOpen(false);
      setCreateForm(defaultFormValues);
      setMessage(t("ui.feedback.created"));
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : t("ui.feedback.requestFailed"),
      );
    }
  };

  const handleUpdateCampaign = async () => {
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
        error instanceof Error ? error.message : t("ui.feedback.requestFailed"),
      );
    }
  };

  const handleDeleteDialogOpenChange = (open: boolean) => {
    if (!open) {
      setDeleteCampaign(null);
    }
  };

  const handleDeleteCampaign = async () => {
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
        error instanceof Error ? error.message : t("ui.feedback.requestFailed"),
      );
    }
  };

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
              <Button onClick={handleOpenCreate}>
                {t("ui.campaigns.create")}
              </Button>
            </UiDiv>

            <FeedbackMessage message={feedback} />

            <ListControls
              searchValue={searchQuery}
              onSearchChange={setSearchQuery}
              searchPlaceholder={t("ui.list.searchCampaigns")}
              sortValue={sortBy}
              onSortChange={handleSortChange}
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
                  canManage={handleCanManageCampaign}
                  onEdit={handleEditCampaign}
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
        onClose={handleCloseCreate}
        footer={
          <>
            <Button variant="outline" onClick={handleCloseCreate}>
              {t("ui.actions.close")}
            </Button>
            <Button disabled={anyPending} onClick={handleCreateCampaign}>
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
        onClose={handleCloseEdit}
        footer={
          <>
            <Button variant="outline" onClick={handleCloseEdit}>
              {t("ui.actions.close")}
            </Button>
            <Button
              disabled={anyPending || !editCampaign}
              onClick={handleUpdateCampaign}
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
        onOpenChange={handleDeleteDialogOpenChange}
        onConfirm={handleDeleteCampaign}
      />
    </>
  );
};

export default CampaignsPageView;
