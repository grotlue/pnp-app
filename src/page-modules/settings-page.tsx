"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/common/app-header";
import { FeedbackMessage } from "@/components/common/feedback-message";
import { FormInput } from "@/components/common/form-controls";
import { Modal } from "@/components/common/modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { clearSession } from "@/lib/client/session";
import { useClientSession } from "@/lib/client/use-client-session";
import { getTranslator, type AppLocale } from "@/lib/i18n/index";
import {
  deleteMyAccount,
  updateMyEmail,
  updateMyPassword,
} from "@/features/users/queries/users-settings.query";
import { getMe } from "@/features/users/queries/users-profile.query";

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

  useEffect(() => {
    if (!ready) {
      return;
    }
    if (!session) {
      router.replace("/");
      return;
    }

    void (async () => {
      try {
        const me = await getMe(session);
        if (me.profile.role === "admin") {
          router.replace("/admin/users");
        }
      } catch {
        // Route guards and API errors are handled by the page itself.
      }
    })();
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
      <AppHeader locale={locale} session={session} />
      <main className="mx-auto w-full max-w-4xl px-4 py-8">
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
                      error instanceof Error ? error.message : t("ui.feedback.requestFailed"),
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
                      error instanceof Error ? error.message : t("ui.feedback.requestFailed"),
                    );
                  }
                })
              }
            >
              {t("ui.actions.changePassword")}
            </Button>

            <Button variant="destructive" disabled={busy} onClick={() => setDeleteOpen(true)}>
              {t("ui.actions.deleteAccount")}
            </Button>

            <FeedbackMessage message={message} />
          </CardContent>
        </Card>
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
                      error instanceof Error ? error.message : t("ui.feedback.requestFailed"),
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
