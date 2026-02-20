"use client";

import { UiDiv } from "@/components/ui/html-elements";
import {
  AuthCardPageContent,
  AuthCardPageMain,
} from "@/components/ui/page-shell";
import { TextLink } from "@/components/ui/text-link";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { setSession } from "@/lib/client/session";
import { type AppLocale, getTranslator } from "@/lib/i18n/index";
import {
  exchangeAuthCode,
  verifyAuthToken,
} from "@/features/users/queries/users-auth.query";
import {
  getAuthParamsFromUrl,
  getSessionTokensFromUrl,
} from "./auth-session-from-url";

type AuthCallbackPageViewProps = {
  locale: AppLocale;
};

const AuthCallbackPageView = ({ locale }: AuthCallbackPageViewProps) => {
  const t = getTranslator(locale);
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const tokenSession = getSessionTokensFromUrl(window.location);
        if (tokenSession) {
          setSession(tokenSession);
          window.history.replaceState({}, "", window.location.pathname);
          if (!cancelled) {
            router.replace("/");
          }
          return;
        }

        const params = getAuthParamsFromUrl(window.location);
        if (params.code) {
          const response = await exchangeAuthCode({ code: params.code });
          setSession({
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            expiresAt: response.expiresAt,
          });
          window.history.replaceState({}, "", window.location.pathname);
          if (!cancelled) {
            router.replace("/");
          }
          return;
        }

        if (params.tokenHash && params.type) {
          const response = await verifyAuthToken({
            tokenHash: params.tokenHash,
            type: params.type,
          });

          if (response.accessToken && response.refreshToken) {
            setSession({
              accessToken: response.accessToken,
              refreshToken: response.refreshToken,
              expiresAt: response.expiresAt,
            });
          }

          window.history.replaceState({}, "", window.location.pathname);
          if (!cancelled) {
            router.replace("/");
          }
          return;
        }

        if (!cancelled) {
          setErrorMessage(t("ui.authCallback.invalidLink"));
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : t("ui.feedback.requestFailed"),
          );
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [router, t]);

  return (
    <AuthCardPageMain>
      <AuthCardPageContent>
        <Card>
          <CardHeader>
            <CardTitle>{t("ui.authCallback.title")}</CardTitle>
            <CardDescription>{t("ui.authCallback.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent stack={2} textStyle="sm">
            {errorMessage ? (
              <FeedbackMessage message={errorMessage} />
            ) : (
              <UiDiv textStyle="muted">{t("ui.authCallback.processing")}</UiDiv>
            )}
            {errorMessage ? (
              <TextLink href="/" size="xs">
                {t("ui.nav.backToLogin")}
              </TextLink>
            ) : null}
          </CardContent>
        </Card>
      </AuthCardPageContent>
    </AuthCardPageMain>
  );
};

export default AuthCallbackPageView;
