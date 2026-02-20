"use client";

import { UiDiv } from "@/components/ui/html-elements";
import { AppPageMain, PageViewport } from "@/components/ui/page-shell";

import { useEffect, useMemo, useState } from "react";
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
import { getTranslator, type AppLocale } from "@/lib/i18n/index";
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

export function SettingsPageView({ locale }: SettingsScreenProps) {
  const t = useMemo(() => getTranslator(locale), [locale]);
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

  async function run(action: () => Promise<void>) {
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
  }

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
              onChange={(event) => setNewEmail(event.target.value)}
            />
            <Button
              variant="outline"
              disabled={busy}
              onClick={() =>
                void run(async () => {
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
                })
              }
            >
              {t("ui.actions.changeEmail")}
            </Button>

            <FormInput
              type="password"
              value={newPassword}
              placeholder={t("ui.fields.newPassword")}
              onChange={(event) => setNewPassword(event.target.value)}
            />
            <Button
              variant="outline"
              disabled={busy}
              onClick={() =>
                void run(async () => {
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
                })
              }
            >
              {t("ui.actions.changePassword")}
            </Button>

            <Button
              variant="destructive"
              disabled={busy}
              onClick={() => setDeleteOpen(true)}
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
                onChange={(event) => setMfaCode(event.target.value)}
              />

              <UiDiv wrapGap={2}>
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() =>
                    void run(async () => {
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
                    })
                  }
                >
                  {t("ui.actions.setupMfa")}
                </Button>
                <Button
                  disabled={busy || !mfaFactorId}
                  onClick={() =>
                    void run(async () => {
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
                          refreshToken:
                            verified.refreshToken ?? session.refreshToken,
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
                    })
                  }
                >
                  {t("ui.actions.verifyMfa")}
                </Button>
                <Button
                  variant="ghost"
                  disabled={busy}
                  onClick={() => void adminMfaQuery.refetch()}
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
        onClose={() => setDeleteOpen(false)}
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              {t("ui.actions.close")}
            </Button>
            <Button
              variant="destructive"
              disabled={busy}
              onClick={() =>
                void run(async () => {
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
                })
              }
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
}
