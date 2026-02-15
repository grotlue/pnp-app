"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FeedbackMessage } from "@/components/common/feedback-message";
import { FormInput } from "@/components/common/form-controls";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { setSession } from "@/lib/client/session";
import { getTranslator, type AppLocale } from "@/lib/i18n/index";
import {
  confirmPasswordReset,
  exchangeAuthCode,
  verifyAuthToken,
} from "@/features/users/queries/users-auth.query";
import {
  getAuthParamsFromUrl,
  getSessionTokensFromUrl,
  type SessionTokens,
} from "./auth-session-from-url";

type AuthResetPasswordPageViewProps = {
  locale: AppLocale;
};

export function AuthResetPasswordPageView({ locale }: AuthResetPasswordPageViewProps) {
  const t = useMemo(() => getTranslator(locale), [locale]);
  const router = useRouter();

  const [sessionTokens, setSessionTokens] = useState<SessionTokens | null>(null);
  const [resolving, setResolving] = useState(true);
  const [busy, setBusy] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [resolveError, setResolveError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function resolveTokens() {
      try {
        const directTokens = getSessionTokensFromUrl(window.location);
        if (directTokens) {
          if (!cancelled) {
            setSessionTokens(directTokens);
            setResolving(false);
          }
          window.history.replaceState({}, "", window.location.pathname);
          return;
        }

        const params = getAuthParamsFromUrl(window.location);
        if (params.code) {
          const response = await exchangeAuthCode({ code: params.code });
          if (!response.refreshToken) {
            if (!cancelled) {
              setResolveError(t("ui.authReset.invalidLink"));
              setResolving(false);
            }
          } else if (!cancelled) {
            setSessionTokens({
              accessToken: response.accessToken,
              refreshToken: response.refreshToken,
              expiresAt: response.expiresAt,
            });
            setResolving(false);
          }
          window.history.replaceState({}, "", window.location.pathname);
          return;
        }

        if (params.tokenHash && params.type) {
          const response = await verifyAuthToken({
            tokenHash: params.tokenHash,
            type: params.type,
          });

          if (response.accessToken && response.refreshToken) {
            if (!cancelled) {
              setSessionTokens({
                accessToken: response.accessToken,
                refreshToken: response.refreshToken,
                expiresAt: response.expiresAt,
              });
              setResolving(false);
            }
          } else if (!cancelled) {
            setResolveError(t("ui.authReset.invalidLink"));
            setResolving(false);
          }

          window.history.replaceState({}, "", window.location.pathname);
          return;
        }

        if (!cancelled) {
          setResolveError(t("ui.authReset.invalidLink"));
          setResolving(false);
        }
      } catch (error) {
        if (!cancelled) {
          setResolveError(error instanceof Error ? error.message : t("ui.feedback.requestFailed"));
          setResolving(false);
        }
      }
    }

    void resolveTokens();
    return () => {
      cancelled = true;
    };
  }, [t]);

  async function onSubmit() {
    if (!sessionTokens) {
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      const response = await confirmPasswordReset({
        accessToken: sessionTokens.accessToken,
        refreshToken: sessionTokens.refreshToken,
        newPassword,
      });

      setSession({
        accessToken: response.accessToken ?? sessionTokens.accessToken,
        refreshToken: response.refreshToken ?? sessionTokens.refreshToken,
        expiresAt: response.expiresAt ?? sessionTokens.expiresAt,
      });

      setMessage(t("ui.authReset.updated"));
      router.replace("/");
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
            <CardTitle>{t("ui.authReset.title")}</CardTitle>
            <CardDescription>{t("ui.authReset.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {resolving ? (
              <div className="text-sm text-muted-foreground">{t("ui.authReset.processing")}</div>
            ) : sessionTokens ? (
              <FormInput
                type="password"
                placeholder={t("ui.fields.newPassword")}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
              />
            ) : (
              <FeedbackMessage message={resolveError || t("ui.authReset.invalidLink")} />
            )}

            <FeedbackMessage message={message} />
          </CardContent>
          <CardFooter className="flex-col items-stretch gap-2">
            {sessionTokens ? (
              <Button disabled={busy || !newPassword} onClick={() => void onSubmit()}>
                {t("ui.authReset.submit")}
              </Button>
            ) : (
              <Button asChild variant="outline">
                <Link href="/password-reset">{t("ui.nav.passwordReset")}</Link>
              </Button>
            )}
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
