"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { appRoutes } from "@/app/router";
import { FeedbackMessage } from "@/components/common/feedback-message";
import { FormInput } from "@/components/common/form-controls";
import { TurnstileWidget } from "@/components/common/turnstile-widget";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { resendVerificationEmail } from "@/features/users/queries/users-auth.query";
import { resolveAuthCaptchaClientConfig } from "@/lib/features/auth-captcha";
import { getTranslator, type AppLocale } from "@/lib/i18n/index";
import { textLinkClassName } from "@/lib/utils/link";

type ResendVerificationScreenProps = {
  locale: AppLocale;
};

export function ResendVerificationPageView({ locale }: ResendVerificationScreenProps) {
  const t = useMemo(() => getTranslator(locale), [locale]);
  const authCaptchaConfig = useMemo(() => resolveAuthCaptchaClientConfig(), []);
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);

  async function onSubmit() {
    if (authCaptchaConfig.required && !captchaToken) {
      setMessage(t("ui.feedback.captchaRequired"));
      return;
    }

    setBusy(true);
    setMessage("");
    try {
      await resendVerificationEmail({
        email,
        ...(captchaToken ? { captchaToken } : {}),
      });
      setMessage(t("ui.feedback.verificationEmailSent"));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("ui.feedback.requestFailed"));
    } finally {
      if (authCaptchaConfig.enabled) {
        setCaptchaToken(null);
        setCaptchaResetKey((prev) => prev + 1);
      }
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(130deg,oklch(0.96_0.04_76),oklch(0.98_0.01_180)_40%,oklch(0.95_0.05_138))] px-4 py-12">
      <div className="mx-auto w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>{t("ui.resendVerification.title")}</CardTitle>
            <CardDescription>{t("ui.resendVerification.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <FormInput
              type="email"
              placeholder={t("ui.fields.email")}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            {authCaptchaConfig.enabled && authCaptchaConfig.siteKey ? (
              <TurnstileWidget
                siteKey={authCaptchaConfig.siteKey}
                resetKey={captchaResetKey}
                loadErrorMessage={t("ui.feedback.captchaUnavailable")}
                onTokenChange={setCaptchaToken}
              />
            ) : null}
            <FeedbackMessage message={message} />
          </CardContent>
          <CardFooter className="flex-col items-stretch gap-2">
            <Button
              disabled={busy || !email || (authCaptchaConfig.required && !captchaToken)}
              onClick={onSubmit}
            >
              {t("ui.actions.resendVerification")}
            </Button>
            <div className="flex items-center justify-between text-xs">
              <Link className={textLinkClassName} href={appRoutes.home}>
                {t("ui.nav.backToLogin")}
              </Link>
              <Link className={textLinkClassName} href={appRoutes.register}>
                {t("ui.nav.register")}
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
