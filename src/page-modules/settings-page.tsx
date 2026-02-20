"use client";

import { UiDiv } from "@/components/ui/html-elements";
import { AppPageMain, PageViewport } from "@/components/ui/page-shell";

import { type ChangeEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { FormInput } from "@/components/ui/form-controls";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  clearSession,
  setSession as persistSession,
} from "@/lib/client/session";
import { useClientSession } from "@/lib/client/use-client-session";
import { type AppLocale, getTranslator } from "@/lib/i18n/index";
import { useAdminMfaStatusQuery } from "@/features/users/hooks/use-admin-mfa-status-query";
import { useMeQuery } from "@/features/users/hooks/use-me-query";
import {
  enrollAdminTotp,
  verifyAdminTotp,
} from "@/features/users/queries/users-mfa.query";
import {
  deleteMyAccount,
  updateMyEmail,
  updateMyPassword,
} from "@/features/users/queries/users-settings.query";
import type { AdminMfaEnrollResponse } from "@/features/users/types";

type SettingsScreenProps = {
  locale: AppLocale;
};

const SettingsPageView = ({ locale }: SettingsScreenProps) => {
  const t = getTranslator(locale);
  const router = useRouter();
  const { session, ready } = useClientSession();

  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaEnrollment, setMfaEnrollment] =
    useState<AdminMfaEnrollResponse | null>(null);
  const meQuery = useMeQuery(session);
  const isAdminUser = meQuery.data?.profile.role === "admin";
  const adminMfaQuery = useAdminMfaStatusQuery(session, isAdminUser);
  const adminNeedsMfaStepUp =
    isAdminUser &&
    adminMfaQuery.data?.mfaRequired === true &&
    adminMfaQuery.data.currentLevel !== "aal2";
  const hasVerifiedTotp = adminMfaQuery.data?.hasVerifiedTotp === true;
  const fallbackUnverifiedFactor = adminMfaQuery.data?.factors.find(
    (factor) => factor.status === "unverified",
  );
  const fallbackVerifiedFactor = adminMfaQuery.data?.factors.find(
    (factor) => factor.status === "verified",
  );
  const mfaFactorId =
    mfaEnrollment?.factorId ??
    (adminNeedsMfaStepUp
      ? fallbackVerifiedFactor?.id
      : fallbackUnverifiedFactor?.id) ??
    fallbackUnverifiedFactor?.id ??
    fallbackVerifiedFactor?.id ??
    null;

  useEffect(() => {
    if (!ready) {
      return;
    }
    if (!session) {
      router.replace("/");
    }
  }, [ready, session, router]);

  const run = async (action: () => Promise<void>) => {
    if (!session) {
      return;
    }

    setBusy(true);
    setMessage("");
    try {
      await action();
    } finally {
      setBusy(false);
    }
  };

  const handleEmailChange = (event: ChangeEvent<HTMLInputElement>) => {
    setNewEmail(event.target.value);
  };

  const handlePasswordChange = (event: ChangeEvent<HTMLInputElement>) => {
    setNewPassword(event.target.value);
  };

  const handleMfaCodeChange = (event: ChangeEvent<HTMLInputElement>) => {
    setMfaCode(event.target.value);
  };

  const handleUpdateEmail = async () => {
    if (!session) {
      return;
    }
    await run(async () => {
      try {
        await updateMyEmail(session, { newEmail });
        setMessage(t("ui.feedback.saved"));
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : t("ui.feedback.requestFailed"),
        );
      }
    });
  };

  const handleUpdatePassword = async () => {
    if (!session) {
      return;
    }
    await run(async () => {
      try {
        await updateMyPassword(session, { newPassword });
        setMessage(t("ui.feedback.saved"));
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : t("ui.feedback.requestFailed"),
        );
      }
    });
  };

  const handleOpenDelete = () => {
    setDeleteOpen(true);
  };

  const handleCloseDelete = () => {
    setDeleteOpen(false);
  };

  const handleSetupMfa = async () => {
    if (!session) {
      return;
    }

    await run(async () => {
      try {
        const enrollment = await enrollAdminTotp(session, {
          friendlyName: "pnp-app admin",
        });
        setMfaEnrollment(enrollment);
        setMessage(t("ui.settings.mfaSetupStarted"));
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : t("ui.feedback.requestFailed"),
        );
      }
    });
  };

  const handleVerifyMfa = async () => {
    if (!session) {
      return;
    }

    await run(async () => {
      if (!mfaFactorId) {
        setMessage(t("ui.settings.mfaSetupMissing"));
        return;
      }

      try {
        const verified = await verifyAdminTotp(session, {
          factorId: mfaFactorId,
          code: mfaCode,
        });
        persistSession({
          accessToken: verified.accessToken,
          refreshToken: verified.refreshToken ?? session.refreshToken,
          expiresAt: verified.expiresAt,
        });
        setMfaEnrollment(null);
        setMfaCode("");
        await adminMfaQuery.refetch();
        await meQuery.refetch();
        router.refresh();
        setMessage(t("ui.feedback.mfaEnabled"));
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : t("ui.feedback.requestFailed"),
        );
      }
    });
  };

  const handleRefetchMfaStatus = () => {
    void adminMfaQuery.refetch();
  };

  const handleDeleteAccount = async () => {
    if (!session) {
      return;
    }

    await run(async () => {
      try {
        await deleteMyAccount(session);
        setDeleteOpen(false);
        clearSession();
        router.replace("/");
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : t("ui.feedback.requestFailed"),
        );
      }
    });
  };

  if (!ready) {
    return <PageViewport />;
  }

  if (!session) {
    return <PageViewport />;
  }

  return (
    <>
      <AppPageMain maxWidth="4xl" layout="stack-4">
        <Card>
          <CardHeader>
            <CardTitle>{t("ui.settings.title")}</CardTitle>
            <CardDescription>{t("ui.settings.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent stack={3}>
            <FormInput
              value={newEmail}
              placeholder={t("ui.fields.newEmail")}
              onChange={handleEmailChange}
            />
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => void handleUpdateEmail()}
            >
              {t("ui.actions.changeEmail")}
            </Button>

            <FormInput
              type="password"
              value={newPassword}
              placeholder={t("ui.fields.newPassword")}
              onChange={handlePasswordChange}
            />
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => void handleUpdatePassword()}
            >
              {t("ui.actions.changePassword")}
            </Button>

            <Button
              variant="destructive"
              disabled={busy}
              onClick={handleOpenDelete}
            >
              {t("ui.actions.deleteAccount")}
            </Button>

            <FeedbackMessage message={message} />
          </CardContent>
        </Card>

        {isAdminUser ? (
          <Card>
            <CardHeader>
              <CardTitle>{t("ui.settings.mfaTitle")}</CardTitle>
              <CardDescription>{t("ui.settings.mfaSubtitle")}</CardDescription>
            </CardHeader>
            <CardContent stack={3}>
              <UiDiv textStyle="sm">
                {adminMfaQuery.isLoading
                  ? t("ui.loading.section")
                  : adminNeedsMfaStepUp
                    ? hasVerifiedTotp
                      ? t("ui.settings.mfaStepUpRequired")
                      : t("ui.settings.mfaRequired")
                    : hasVerifiedTotp
                      ? t("ui.settings.mfaEnabled")
                      : t("ui.settings.mfaNotEnabled")}
              </UiDiv>

              {mfaEnrollment ? (
                <UiDiv surface="muted-panel" stack={2}>
                  <UiDiv textStyle="muted-xs">
                    {t("ui.settings.mfaSetupStep")}
                  </UiDiv>
                  <UiDiv textStyle="mono-xs-break">
                    {mfaEnrollment.secret}
                  </UiDiv>
                  <UiDiv textStyle="muted-mono-2xs-break">
                    {mfaEnrollment.uri}
                  </UiDiv>
                </UiDiv>
              ) : null}

              <FormInput
                value={mfaCode}
                placeholder={t("ui.fields.mfaCode")}
                onChange={handleMfaCodeChange}
              />

              <UiDiv wrapGap={2}>
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() => void handleSetupMfa()}
                >
                  {t("ui.actions.setupMfa")}
                </Button>
                <Button
                  disabled={busy || !mfaFactorId}
                  onClick={() => void handleVerifyMfa()}
                >
                  {t("ui.actions.verifyMfa")}
                </Button>
                <Button
                  variant="ghost"
                  disabled={busy}
                  onClick={handleRefetchMfaStatus}
                >
                  {t("ui.actions.reload")}
                </Button>
              </UiDiv>

              <FeedbackMessage
                message={
                  adminMfaQuery.error instanceof Error
                    ? adminMfaQuery.error.message
                    : ""
                }
              />
            </CardContent>
          </Card>
        ) : null}
      </AppPageMain>

      <Modal
        open={deleteOpen}
        title={t("ui.settings.deleteTitle")}
        onClose={handleCloseDelete}
        footer={
          <>
            <Button variant="outline" onClick={handleCloseDelete}>
              {t("ui.actions.close")}
            </Button>
            <Button
              variant="destructive"
              disabled={busy}
              onClick={() => void handleDeleteAccount()}
            >
              {t("ui.actions.confirmDelete")}
            </Button>
          </>
        }
      >
        <UiDiv textStyle="sm">{t("ui.settings.deleteConfirm")}</UiDiv>
      </Modal>
    </>
  );
};

export default SettingsPageView;
