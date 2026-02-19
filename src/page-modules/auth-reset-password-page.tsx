"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FeedbackMessage } from "@/components/common/feedback-message";
import { FormInput } from "@/components/common/form-controls";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useClientSession } from "@/lib/client/use-client-session";
import { getTranslator, type AppLocale } from "@/lib/i18n/index";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser-client";
import { textLinkClassName } from "@/lib/utils/link";

type AuthResetPasswordPageViewProps = {
  locale: AppLocale;
};

export function AuthResetPasswordPageView({
  locale,
}: AuthResetPasswordPageViewProps) {
  const t = useMemo(() => getTranslator(locale), [locale]);
  const router = useRouter();
  const { ready, session } = useClientSession();

  const [busy, setBusy] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");

  const canReset = Boolean(session);

  async function onSubmit() {
    if (!canReset) {
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      const supabase = getBrowserSupabaseClient();
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw error;
      }

      setMessage(t("ui.authReset.updated"));
      router.replace("/");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : t("ui.feedback.requestFailed"),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(130deg,oklch(0.96_0.04_76),oklch(0.98_0.01_180)_40%,oklch(0.95_0.05_138))] px-4 py-12">
      <div className="mx-auto w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>{t("ui.authReset.title")}</CardTitle>
            <CardDescription>{t("ui.authReset.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {!ready ? (
              <div className="text-muted-foreground text-sm">
                {t("ui.authReset.processing")}
              </div>
            ) : canReset ? (
              <FormInput
                type="password"
                placeholder={t("ui.fields.newPassword")}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
              />
            ) : (
              <FeedbackMessage message={t("ui.authReset.invalidLink")} />
            )}

            <FeedbackMessage message={message} />
          </CardContent>
          <CardFooter className="flex-col items-stretch gap-2">
            {canReset ? (
              <Button
                disabled={busy || !newPassword}
                onClick={() => void onSubmit()}
              >
                {t("ui.authReset.submit")}
              </Button>
            ) : (
              <Button asChild variant="outline">
                <Link href="/password-reset" className={textLinkClassName}>
                  {t("ui.nav.passwordReset")}
                </Link>
              </Button>
            )}
            <div className="text-xs">
              <Link className={textLinkClassName} href="/">
                {t("ui.nav.backToLogin")}
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
