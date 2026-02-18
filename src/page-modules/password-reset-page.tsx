"use client";

import { UiDiv } from "@/components/ui/html-elements";
import {
  AuthCardPageContent,
  AuthCardPageMain,
} from "@/components/ui/page-shell";
import { TextLink } from "@/components/ui/text-link";

import { useMemo, useState } from "react";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { FormInput } from "@/components/ui/form-controls";
import {
  TurnstileWidget,
  type TurnstileErrorReason,
} from "@/components/common/turnstile-widget";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { resolveAuthCaptchaClientConfig } from "@/lib/features/auth-captcha";
import { getTranslator, type AppLocale } from "@/lib/i18n/index";
import { requestPasswordReset } from "@/features/users/queries/users-auth.query";

type PasswordResetScreenProps = {
  locale: AppLocale;
};

function getCaptchaFailureMessage(
  t: ReturnType<typeof getTranslator>,
  reason: TurnstileErrorReason | null,
): string {
  if (!reason) {
    return t("ui.feedback.captchaRequired");
  }

  if (reason === "widget_error" || reason === "render_failed") {
    return t("ui.feedback.captchaInitializationFailed");
  }

  return t("ui.feedback.captchaUnavailable");
}

export function PasswordResetPageView({ locale }: PasswordResetScreenProps) {
  const t = useMemo(() => getTranslator(locale), [locale]);
  const authCaptchaConfig = useMemo(() => resolveAuthCaptchaClientConfig(), []);
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);
  const [captchaErrorReason, setCaptchaErrorReason] =
    useState<TurnstileErrorReason | null>(null);

  async function onSubmit() {
    if (authCaptchaConfig.required && !authCaptchaConfig.enabled) {
      setMessage(t("ui.feedback.captchaMisconfigured"));
      return;
    }

    if (authCaptchaConfig.required && !captchaToken) {
      setMessage(getCaptchaFailureMessage(t, captchaErrorReason));
      return;
    }

    setBusy(true);
    setMessage("");
    try {
      await requestPasswordReset({
        email,
        ...(captchaToken ? { captchaToken } : {}),
      });
      setMessage(t("ui.feedback.passwordResetSent"));
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : t("ui.feedback.requestFailed"),
      );
    } finally {
      if (authCaptchaConfig.enabled) {
        setCaptchaToken(null);
        setCaptchaErrorReason(null);
        setCaptchaResetKey((prev) => prev + 1);
      }
      setBusy(false);
    }
  }

  return (
    <AuthCardPageMain>
      <AuthCardPageContent>
        <Card>
          <CardHeader>
            <CardTitle>{t("ui.passwordReset.title")}</CardTitle>
            <CardDescription>{t("ui.passwordReset.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent stack={3}>
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
                onTokenChange={(token) => {
                  if (token) {
                    setCaptchaErrorReason(null);
                  }
                  setCaptchaToken(token);
                }}
                onErrorReason={setCaptchaErrorReason}
              />
            ) : null}
            <FeedbackMessage message={message} />
          </CardContent>
          <CardFooter layout="column-stretch">
            <Button disabled={busy} onClick={onSubmit}>
              {t("ui.actions.sendReset")}
            </Button>
            <UiDiv textStyle="xs">
              <TextLink href="/">{t("ui.nav.backToLogin")}</TextLink>
            </UiDiv>
          </CardFooter>
        </Card>
      </AuthCardPageContent>
    </AuthCardPageMain>
  );
}
