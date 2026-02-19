"use client";

import Link from "next/link";
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
import { getTranslator, type AppLocale } from "@/lib/i18n/index";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser-client";
import { textLinkClassName } from "@/lib/utils/link";
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
        const supabase = getBrowserSupabaseClient();
        const tokenSession = getSessionTokensFromUrl(window.location);
        if (tokenSession) {
          const { error } = await supabase.auth.setSession({
            access_token: tokenSession.accessToken,
            refresh_token: tokenSession.refreshToken,
          });
          if (error) {
            throw error;
          }

          window.history.replaceState({}, "", window.location.pathname);
          if (!cancelled) {
            router.replace("/");
          }
          return;
        }

        const params = getAuthParamsFromUrl(window.location);
        if (params.code) {
          const { error } = await supabase.auth.exchangeCodeForSession(
            params.code,
          );
          if (error) {
            throw error;
          }

          window.history.replaceState({}, "", window.location.pathname);
          if (!cancelled) {
            router.replace("/");
          }
          return;
        }

        if (params.tokenHash && params.type) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: params.tokenHash,
            type: params.type,
          });
          if (error) {
            throw error;
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
    <main className="min-h-screen bg-[linear-gradient(130deg,oklch(0.96_0.04_76),oklch(0.98_0.01_180)_40%,oklch(0.95_0.05_138))] px-4 py-12">
      <div className="mx-auto w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>{t("ui.authCallback.title")}</CardTitle>
            <CardDescription>{t("ui.authCallback.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {errorMessage ? (
              <FeedbackMessage message={errorMessage} />
            ) : (
              <div className="text-muted-foreground">
                {t("ui.authCallback.processing")}
              </div>
            )}
            {errorMessage ? (
              <Link href="/" className={`text-xs ${textLinkClassName}`}>
                {t("ui.nav.backToLogin")}
              </Link>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
