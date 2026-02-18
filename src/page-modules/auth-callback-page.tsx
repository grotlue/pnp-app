"use client";

import { UiDiv, UiMain } from "@/components/ui/html-elements";
import { TextLink } from "@/components/ui/text-link";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FeedbackMessage } from "@/components/common/feedback-message";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { setSession } from "@/lib/client/session";
import { getTranslator, type AppLocale } from "@/lib/i18n/index";
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

export function AuthCallbackPageView({ locale }: AuthCallbackPageViewProps) {
  const t = useMemo(() => getTranslator(locale), [locale]);
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function run() {
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
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [router, t]);

  return (
    <UiMain className="min-h-screen bg-[linear-gradient(130deg,oklch(0.96_0.04_76),oklch(0.98_0.01_180)_40%,oklch(0.95_0.05_138))] px-4 py-12">
      <UiDiv className="mx-auto w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>{t("ui.authCallback.title")}</CardTitle>
            <CardDescription>{t("ui.authCallback.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {errorMessage ? (
              <FeedbackMessage message={errorMessage} />
            ) : (
              <UiDiv className="text-muted-foreground">
                {t("ui.authCallback.processing")}
              </UiDiv>
            )}
            {errorMessage ? (
              <TextLink href="/" size="xs">
                {t("ui.nav.backToLogin")}
              </TextLink>
            ) : null}
          </CardContent>
        </Card>
      </UiDiv>
    </UiMain>
  );
}
