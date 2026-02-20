"use client";

import { UiDiv } from "@/components/ui/html-elements";
import {
  AuthCardPageContent,
  AuthCardPageMain,
} from "@/components/ui/page-shell";
import { TextLink } from "@/components/ui/text-link";

import { type ChangeEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { FormInput } from "@/components/ui/form-controls";
import {
  type TurnstileErrorReason,
  TurnstileWidget,
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
import { type AppLocale, getTranslator } from "@/lib/i18n/index";
import { resolveAuthCaptchaClientConfig } from "@/lib/features/auth-captcha";
import { registerUser } from "@/features/users/queries/users-auth.query";

type RegisterScreenProps = {
  locale: AppLocale;
};

const getCaptchaFailureMessage = (
  t: ReturnType<typeof getTranslator>,
  reason: TurnstileErrorReason | null,
): string => {
  if (!reason) {
    return t("ui.feedback.captchaRequired");
  }

  if (reason === "widget_error" || reason === "render_failed") {
    return t("ui.feedback.captchaInitializationFailed");
  }

  return t("ui.feedback.captchaUnavailable");
};

const RegisterPageView = ({ locale }: RegisterScreenProps) => {
  const t = getTranslator(locale);
  const authCaptchaConfig = resolveAuthCaptchaClientConfig();
  const router = useRouter();

  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);
  const [captchaErrorReason, setCaptchaErrorReason] =
    useState<TurnstileErrorReason | null>(null);
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });

  const onSubmit = async () => {
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
      await registerUser({
        ...form,
        locale,
        ...(captchaToken ? { captchaToken } : {}),
      });
      router.push("/?registered=1");
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
  };

  const handleUsernameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, username: event.target.value }));
  };

  const handleEmailChange = (event: ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, email: event.target.value }));
  };

  const handlePasswordChange = (event: ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, password: event.target.value }));
  };

  const handleCaptchaTokenChange = (token: string | null) => {
    if (token) {
      setCaptchaErrorReason(null);
    }
    setCaptchaToken(token);
  };

  return (
    <AuthCardPageMain>
      <AuthCardPageContent>
        <Card>
          <CardHeader>
            <CardTitle>{t("ui.register.title")}</CardTitle>
            <CardDescription>{t("ui.register.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent stack={3}>
            <FormInput
              placeholder={t("ui.fields.username")}
              value={form.username}
              onChange={handleUsernameChange}
            />
            <FormInput
              type="email"
              placeholder={t("ui.fields.email")}
              value={form.email}
              onChange={handleEmailChange}
            />
            <FormInput
              type="password"
              placeholder={t("ui.fields.password")}
              value={form.password}
              onChange={handlePasswordChange}
            />
            {authCaptchaConfig.enabled && authCaptchaConfig.siteKey ? (
              <TurnstileWidget
                siteKey={authCaptchaConfig.siteKey}
                resetKey={captchaResetKey}
                loadErrorMessage={t("ui.feedback.captchaUnavailable")}
                onTokenChange={handleCaptchaTokenChange}
                onErrorReason={setCaptchaErrorReason}
              />
            ) : null}
            <FeedbackMessage message={message} />
          </CardContent>
          <CardFooter layout="column-stretch">
            <Button disabled={busy} onClick={onSubmit}>
              {t("ui.actions.register")}
            </Button>
            <UiDiv textStyle="xs">
              <TextLink href="/">{t("ui.register.alreadyRegistered")}</TextLink>
            </UiDiv>
          </CardFooter>
        </Card>
      </AuthCardPageContent>
    </AuthCardPageMain>
  );
};

export default RegisterPageView;
