"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Modal } from "@/components/common/modal";
import { AppHeader } from "@/components/common/app-header";
import { useClientSession } from "@/lib/client/use-client-session";
import { getTranslator, type AppLocale } from "@/lib/i18n/index";
import { isCampaignOwner } from "@/features/campaigns/logic/campaign-role.logic";
import { useCampaignsQuery } from "@/features/campaigns/hooks/use-campaigns-query";
import { useCampaignMutations } from "@/features/campaigns/hooks/use-campaign-mutations";
import { CampaignForm } from "@/features/campaigns/components/campaign-form";
import { CampaignsList } from "@/features/campaigns/components/campaigns-list";
import type { Campaign, CampaignFormValues } from "@/features/campaigns/types";

type CampaignsPageViewProps = {
  locale: AppLocale;
};

const fieldClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";

const defaultFormValues: CampaignFormValues = {
  title: "",
  description: "",
};

export function CampaignsPageView({ locale }: CampaignsPageViewProps) {
  const t = useMemo(() => getTranslator(locale), [locale]);
  const router = useRouter();
  const { session, ready } = useClientSession();

  const [message, setMessage] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editCampaign, setEditCampaign] = useState<Campaign | null>(null);
  const [deleteCampaign, setDeleteCampaign] = useState<Campaign | null>(null);
  const [createForm, setCreateForm] = useState<CampaignFormValues>(defaultFormValues);
  const [editForm, setEditForm] = useState<CampaignFormValues>(defaultFormValues);

  useEffect(() => {
    if (!ready) {
      return;
    }
    if (!session) {
      router.replace("/");
    }
  }, [ready, router, session]);

  const campaignsQuery = useCampaignsQuery(session);
  const { createMutation, updateMutation, deleteMutation, anyPending } = useCampaignMutations(
    session,
  );

  const queryError =
    campaignsQuery.error instanceof Error ? campaignsQuery.error.message : "";
  const feedback = message || queryError;
  const campaigns = campaignsQuery.data?.campaigns ?? [];
  const currentUserId = campaignsQuery.data?.me.user.id;

  if (!ready || !session) {
    return <main className="min-h-screen" />;
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(130deg,oklch(0.96_0.04_76),oklch(0.98_0.01_180)_40%,oklch(0.95_0.05_138))]">
      <AppHeader locale={locale} session={session} />
      <main className="mx-auto w-full max-w-7xl px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>{t("ui.campaigns.title")}</CardTitle>
            <CardDescription>{t("ui.campaigns.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setCreateOpen(true)}>{t("ui.campaigns.create")}</Button>
            </div>

            {feedback ? (
              <div className="rounded-md border border-border bg-background p-2 text-xs">
                {feedback}
              </div>
            ) : null}

            {campaignsQuery.isLoading ? (
              <div className="rounded-lg border border-border bg-background/70 p-3 text-xs text-muted-foreground">
                {t("ui.start.loading")}
              </div>
            ) : (
              <CampaignsList
                campaigns={campaigns}
                currentUserId={currentUserId}
                ownerLabel={t("ui.campaigns.roleOwner")}
                playerLabel={t("ui.campaigns.rolePlayer")}
                editLabel={t("ui.actions.edit")}
                deleteLabel={t("ui.actions.delete")}
                emptyLabel={t("ui.feedback.empty")}
                isOwner={isCampaignOwner}
                onEdit={(campaign) => {
                  setEditCampaign(campaign);
                  setEditForm({
                    title: campaign.title,
                    description: campaign.description,
                  });
                }}
                onDelete={setDeleteCampaign}
              />
            )}
          </CardContent>
        </Card>
      </main>

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
                    error instanceof Error ? error.message : t("ui.feedback.requestFailed"),
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
          inputClassName={fieldClass}
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
                    error instanceof Error ? error.message : t("ui.feedback.requestFailed"),
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
          inputClassName={fieldClass}
        />
      </Modal>

      <Modal
        open={deleteCampaign !== null}
        title={t("ui.campaigns.deleteTitle")}
        onClose={() => setDeleteCampaign(null)}
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteCampaign(null)}>
              {t("ui.actions.close")}
            </Button>
            <Button
              variant="destructive"
              disabled={anyPending || !deleteCampaign}
              onClick={async () => {
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
              }}
            >
              {t("ui.actions.confirmDelete")}
            </Button>
          </>
        }
      >
        <div className="text-sm">{t("ui.campaigns.deleteConfirm")}</div>
      </Modal>
    </div>
  );
}
