"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
import { getTranslator, type AppLocale } from "@/lib/i18n/index";
import { textLinkClassName } from "@/lib/utils/link";
import { resolveAuthCaptchaClientConfig } from "@/lib/features/auth-captcha";
import { registerUser } from "@/features/users/queries/users-auth.query";

type RegisterScreenProps = {
  locale: AppLocale;
};

export function RegisterPageView({ locale }: RegisterScreenProps) {
  const t = useMemo(() => getTranslator(locale), [locale]);
  const authCaptchaConfig = useMemo(() => resolveAuthCaptchaClientConfig(), []);
  const router = useRouter();

  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });

  async function onSubmit() {
    if (authCaptchaConfig.required && !captchaToken) {
      setMessage(t("ui.feedback.captchaRequired"));
      return;
    }

    setBusy(true);
    setMessage("");
    try {
      await registerUser({
        ...form,
        locale,
        ...(captchaToken ? { captchaToken } : {}),
      });
      router.push("/?registered=1");
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
            <CardTitle>{t("ui.register.title")}</CardTitle>
            <CardDescription>{t("ui.register.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <FormInput
              placeholder={t("ui.fields.username")}
              value={form.username}
              onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))}
            />
            <FormInput
              type="email"
              placeholder={t("ui.fields.email")}
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            />
            <FormInput
              type="password"
              placeholder={t("ui.fields.password")}
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
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
              disabled={busy || (authCaptchaConfig.required && !captchaToken)}
              onClick={onSubmit}
            >
              {t("ui.actions.register")}
            </Button>
            <div className="text-xs">
              <Link className={textLinkClassName} href="/">
                {t("ui.register.alreadyRegistered")}
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
