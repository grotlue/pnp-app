"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AppHeader } from "@/components/common/app-header";
import { FeedbackMessage } from "@/components/common/feedback-message";
import { FormInput } from "@/components/common/form-controls";
import { Modal } from "@/components/common/modal";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { queryKeys } from "@/lib/client/query-keys";
import {
  clearSession,
  setSession as persistSession,
} from "@/lib/client/session";
import { useClientSession } from "@/lib/client/use-client-session";
import { getTranslator, type AppLocale } from "@/lib/i18n/index";
import { useMeQuery } from "@/features/users/hooks/use-me-query";
import {
  enrollAdminTotp,
  getAdminMfaStatus,
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
  const adminMfaQuery = useQuery({
    queryKey: queryKeys.adminMfaStatus(session?.accessToken ?? "no-session"),
    enabled: Boolean(session) && isAdminUser,
    staleTime: 30_000,
    queryFn: async () => {
      if (!session) {
        throw new Error("Missing session");
      }

      return getAdminMfaStatus(session);
    },
  });
  const adminNeedsMfaStepUp =
    isAdminUser &&
    adminMfaQuery.data?.mfaRequired === true &&
    adminMfaQuery.data.currentLevel !== "aal2";
  const fallbackUnverifiedFactor = adminMfaQuery.data?.factors.find(
    (factor) => factor.status === "unverified",
  );
  const mfaFactorId =
    mfaEnrollment?.factorId ?? fallbackUnverifiedFactor?.id ?? null;

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
    return <main className="min-h-screen" />;
  }

  if (!session) {
    return <main className="min-h-screen" />;
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(130deg,oklch(0.96_0.04_76),oklch(0.98_0.01_180)_40%,oklch(0.95_0.05_138))]">
      <AppHeader locale={locale} session={session} me={meQuery.data ?? null} />
      <main className="mx-auto w-full max-w-4xl space-y-4 px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>{t("ui.settings.title")}</CardTitle>
            <CardDescription>{t("ui.settings.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
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
            <CardContent className="space-y-3">
              <div className="text-sm">
                {adminMfaQuery.isLoading
                  ? t("ui.loading.section")
                  : adminNeedsMfaStepUp
                    ? t("ui.settings.mfaRequired")
                    : adminMfaQuery.data?.hasVerifiedTotp
                      ? t("ui.settings.mfaEnabled")
                      : t("ui.settings.mfaNotEnabled")}
              </div>

              {mfaEnrollment ? (
                <div className="border-border bg-muted/40 space-y-2 rounded-md border p-3">
                  <div className="text-muted-foreground text-xs">
                    {t("ui.settings.mfaSetupStep")}
                  </div>
                  <div className="font-mono text-xs break-all">
                    {mfaEnrollment.secret}
                  </div>
                  <div className="text-muted-foreground font-mono text-[11px] break-all">
                    {mfaEnrollment.uri}
                  </div>
                </div>
              ) : null}

              <FormInput
                value={mfaCode}
                placeholder={t("ui.fields.mfaCode")}
                onChange={(event) => setMfaCode(event.target.value)}
              />

              <div className="flex flex-wrap gap-2">
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
              </div>

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
      </main>

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
        <div className="text-sm">{t("ui.settings.deleteConfirm")}</div>
      </Modal>
    </div>
  );
}
