"use client";

import { UiDiv } from "@/components/ui/html-elements";
import {
  AuthCardPageContent,
  AuthCardPageMain,
} from "@/components/ui/page-shell";
import { TextLink } from "@/components/ui/text-link";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { FormInput } from "@/components/ui/form-controls";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

export function AuthResetPasswordPageView({
  locale,
}: AuthResetPasswordPageViewProps) {
  const t = useMemo(() => getTranslator(locale), [locale]);
  const router = useRouter();

  const [sessionTokens, setSessionTokens] = useState<SessionTokens | null>(
    null,
  );
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
          setResolveError(
            error instanceof Error
              ? error.message
              : t("ui.feedback.requestFailed"),
          );
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
      setMessage(
        error instanceof Error ? error.message : t("ui.feedback.requestFailed"),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCardPageMain>
      <AuthCardPageContent>
        <Card>
          <CardHeader>
            <CardTitle>{t("ui.authReset.title")}</CardTitle>
            <CardDescription>{t("ui.authReset.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent stack={3}>
            {resolving ? (
              <UiDiv textStyle="muted-sm">{t("ui.authReset.processing")}</UiDiv>
            ) : sessionTokens ? (
              <FormInput
                type="password"
                placeholder={t("ui.fields.newPassword")}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
              />
            ) : (
              <FeedbackMessage
                message={resolveError || t("ui.authReset.invalidLink")}
              />
            )}

            <FeedbackMessage message={message} />
          </CardContent>
          <CardFooter layout="column-stretch">
            {sessionTokens ? (
              <Button
                disabled={busy || !newPassword}
                onClick={() => void onSubmit()}
              >
                {t("ui.authReset.submit")}
              </Button>
            ) : (
              <Button asChild variant="outline">
                <Link href="/password-reset">{t("ui.nav.passwordReset")}</Link>
              </Button>
            )}
            <UiDiv textStyle="xs">
              <TextLink href="/">{t("ui.nav.backToLogin")}</TextLink>
            </UiDiv>
          </CardFooter>
        </Card>
      </AuthCardPageContent>
    </AuthCardPageMain>
  );
}
