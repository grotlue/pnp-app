"use client";

import { UiDiv } from "@/components/ui/html-elements";
import { AppPageMain } from "@/components/ui/page-shell";
import { TextLink } from "@/components/ui/text-link";

import Link from "next/link";
import { type ChangeEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { FormInput } from "@/components/ui/form-controls";
import { PageLoadingState } from "@/components/ui/page-loading-state";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { appRoutes } from "@/app/router";
import { useAdminMfaStatusQuery } from "@/features/users/hooks/use-admin-mfa-status-query";
import { useMeQuery } from "@/features/users/hooks/use-me-query";
import {
  resolveAdminMfaStepUpDecision,
  sanitizeReturnToPath,
} from "@/features/users/logic/admin-mfa-step-up.logic";
import { verifyAdminTotp } from "@/features/users/queries/users-mfa.query";
import { queryKeys } from "@/lib/client/query-keys";
import { setSession as persistSession } from "@/lib/client/session";
import useClientSession from "@/lib/client/use-client-session";
import { type AppLocale, getTranslator } from "@/lib/i18n";

type AdminMfaChallengePageProps = {
  locale: AppLocale;
  returnTo?: string;
};

const AdminMfaChallengePageView = ({
  locale,
  returnTo,
}: AdminMfaChallengePageProps) => {
  const t = getTranslator(locale);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { ready, session } = useClientSession();

  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [code, setCode] = useState("");

  const safeReturnTo = sanitizeReturnToPath(returnTo, appRoutes.adminUsers);

  const meQuery = useMeQuery(session);
  const role = meQuery.data?.profile.role;
  const isAdminUser = role === "admin";

  const adminMfaQuery = useAdminMfaStatusQuery(session, isAdminUser);

  const decision = (() => {
    if (!isAdminUser || !adminMfaQuery.data) {
      return { kind: "none" } as const;
    }

    return resolveAdminMfaStepUpDecision({
      role,
      mfaStatus: adminMfaQuery.data,
    });
  })();

  useEffect(() => {
    if (!ready) {
      return;
    }

    if (!session) {
      router.replace(appRoutes.home);
      return;
    }

    if (!meQuery.isLoading && role && role !== "admin") {
      router.replace(appRoutes.home);
      return;
    }

    if (isAdminUser && adminMfaQuery.isSuccess && decision.kind === "none") {
      router.replace(safeReturnTo);
    }
  }, [
    adminMfaQuery.isSuccess,
    decision.kind,
    isAdminUser,
    meQuery.isLoading,
    ready,
    role,
    router,
    safeReturnTo,
    session,
  ]);

  const onVerify = async () => {
    if (!session || decision.kind !== "challenge") {
      return;
    }

    setBusy(true);
    setMessage("");
    try {
      const verified = await verifyAdminTotp(session, {
        factorId: decision.factorId,
        code,
      });

      persistSession({
        accessToken: verified.accessToken,
        refreshToken: verified.refreshToken ?? session.refreshToken,
        expiresAt: verified.expiresAt,
      });

      queryClient.removeQueries({
        queryKey: queryKeys.me(session.accessToken),
      });
      queryClient.removeQueries({
        queryKey: queryKeys.adminMfaStatus(session.accessToken),
      });

      router.replace(safeReturnTo);
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : t("ui.feedback.requestFailed"),
      );
    } finally {
      setBusy(false);
    }
  };

  const handleRefreshStatus = () => {
    void adminMfaQuery.refetch();
  };

  const handleCodeChange = (event: ChangeEvent<HTMLInputElement>) => {
    setCode(event.target.value);
  };

  const handleVerifyClick = () => {
    void onVerify();
  };

  if (
    !ready ||
    !session ||
    meQuery.isLoading ||
    (isAdminUser && adminMfaQuery.isLoading)
  ) {
    return (
      <AppPageMain maxWidth="4xl">
        <PageLoadingState label={t("ui.loading.page")} density="section" />
      </AppPageMain>
    );
  }

  return (
    <AppPageMain maxWidth="md">
      <Card>
        <CardHeader>
          <CardTitle>{t("ui.settings.mfaTitle")}</CardTitle>
          <CardDescription>
            {t("ui.settings.mfaStepUpRequired")}
          </CardDescription>
        </CardHeader>
        <CardContent stack={3}>
          {decision.kind === "setup" ? (
            <>
              <FeedbackMessage message={t("ui.settings.mfaRequired")} />
              <UiDiv inlineGap={2} contentAlign="center">
                <Link href={appRoutes.settings}>
                  <Button>{t("ui.menu.settings")}</Button>
                </Link>
                <Button variant="ghost" onClick={handleRefreshStatus}>
                  {t("ui.actions.reload")}
                </Button>
              </UiDiv>
            </>
          ) : (
            <>
              <FormInput
                value={code}
                placeholder={t("ui.fields.mfaCode")}
                onChange={handleCodeChange}
              />
              <Button
                disabled={busy || !code || decision.kind !== "challenge"}
                onClick={handleVerifyClick}
              >
                {t("ui.actions.verifyMfa")}
              </Button>
              <UiDiv textStyle="xs">
                <TextLink href={appRoutes.home}>
                  {t("ui.nav.backToLogin")}
                </TextLink>
              </UiDiv>
            </>
          )}

          <FeedbackMessage
            message={
              message ||
              (adminMfaQuery.error instanceof Error
                ? adminMfaQuery.error.message
                : "")
            }
          />
        </CardContent>
      </Card>
    </AppPageMain>
  );
};

export default AdminMfaChallengePageView;
