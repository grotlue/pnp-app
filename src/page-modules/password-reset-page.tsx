"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
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
import { getTranslator, type AppLocale } from "@/lib/i18n/index";
import { requestPasswordReset } from "@/features/users/queries/users-auth.query";

type PasswordResetScreenProps = {
  locale: AppLocale;
};

export function PasswordResetPageView({ locale }: PasswordResetScreenProps) {
  const t = useMemo(() => getTranslator(locale), [locale]);
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  async function onSubmit() {
    setBusy(true);
    setMessage("");
    try {
      await requestPasswordReset({ email });
      setMessage(t("ui.feedback.passwordResetSent"));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("ui.feedback.requestFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(130deg,oklch(0.96_0.04_76),oklch(0.98_0.01_180)_40%,oklch(0.95_0.05_138))] px-4 py-12">
      <div className="mx-auto w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>{t("ui.passwordReset.title")}</CardTitle>
            <CardDescription>{t("ui.passwordReset.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <FormInput
              type="email"
              placeholder={t("ui.fields.email")}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <FeedbackMessage message={message} />
          </CardContent>
          <CardFooter className="flex-col items-stretch gap-2">
            <Button disabled={busy} onClick={onSubmit}>
              {t("ui.actions.sendReset")}
            </Button>
            <div className="text-xs">
              <Link className="underline" href="/">
                {t("ui.nav.backToLogin")}
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
