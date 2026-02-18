"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FeedbackMessage } from "@/components/common/feedback-message";
import { FormInput } from "@/components/common/form-controls";
import { PageLoadingState } from "@/components/common/page-loading-state";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { appRoutes } from "@/app/router";
import { useMeQuery } from "@/features/users/hooks/use-me-query";
import {
  resolveAdminMfaStepUpDecision,
  sanitizeReturnToPath,
} from "@/features/users/logic/admin-mfa-step-up.logic";
import {
  getAdminMfaStatus,
  verifyAdminTotp,
} from "@/features/users/queries/users-mfa.query";
import { queryKeys } from "@/lib/client/query-keys";
import { setSession as persistSession } from "@/lib/client/session";
import { useClientSession } from "@/lib/client/use-client-session";
import { getTranslator, type AppLocale } from "@/lib/i18n";
import { textLinkClassName } from "@/lib/utils/link";

type AdminMfaChallengePageProps = {
  locale: AppLocale;
  returnTo?: string;
};

export function AdminMfaChallengePageView({
  locale,
  returnTo,
}: AdminMfaChallengePageProps) {
  const t = useMemo(() => getTranslator(locale), [locale]);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { ready, session } = useClientSession();

  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [code, setCode] = useState("");

  const safeReturnTo = useMemo(
    () => sanitizeReturnToPath(returnTo, appRoutes.adminUsers),
    [returnTo],
  );

  const meQuery = useMeQuery(session);
  const role = meQuery.data?.profile.role;
  const isAdminUser = role === "admin";

  const adminMfaQuery = useQuery({
    queryKey: queryKeys.adminMfaStatus(session?.accessToken ?? "no-session"),
    enabled: Boolean(session) && isAdminUser,
    staleTime: 30_000,
    queryFn: async () => {
      if (!session) {
        throw new Error("Missing session");
      }
      return getAdminMfaStatus(session);
    },
  });

  const decision = useMemo(() => {
    if (!isAdminUser || !adminMfaQuery.data) {
      return { kind: "none" } as const;
    }

    return resolveAdminMfaStepUpDecision({
      role,
      mfaStatus: adminMfaQuery.data,
    });
  }, [adminMfaQuery.data, isAdminUser, role]);

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

  async function onVerify() {
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
  }

  if (
    !ready ||
    !session ||
    meQuery.isLoading ||
    (isAdminUser && adminMfaQuery.isLoading)
  ) {
    return (
      <div className="min-h-screen bg-[linear-gradient(130deg,oklch(0.96_0.04_76),oklch(0.98_0.01_180)_40%,oklch(0.95_0.05_138))]">
        <main className="mx-auto w-full max-w-4xl px-4 py-8">
          <PageLoadingState label={t("ui.loading.page")} className="py-6" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(130deg,oklch(0.96_0.04_76),oklch(0.98_0.01_180)_40%,oklch(0.95_0.05_138))]">
      <main className="mx-auto w-full max-w-md px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>{t("ui.settings.mfaTitle")}</CardTitle>
            <CardDescription>
              {t("ui.settings.mfaStepUpRequired")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {decision.kind === "setup" ? (
              <>
                <FeedbackMessage message={t("ui.settings.mfaRequired")} />
                <div className="flex items-center gap-2">
                  <Link href={appRoutes.settings}>
                    <Button>{t("ui.menu.settings")}</Button>
                  </Link>
                  <Button
                    variant="ghost"
                    onClick={() => void adminMfaQuery.refetch()}
                  >
                    {t("ui.actions.reload")}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <FormInput
                  value={code}
                  placeholder={t("ui.fields.mfaCode")}
                  onChange={(event) => setCode(event.target.value)}
                />
                <Button
                  disabled={busy || !code || decision.kind !== "challenge"}
                  onClick={() => void onVerify()}
                >
                  {t("ui.actions.verifyMfa")}
                </Button>
                <div className="text-xs">
                  <Link href={appRoutes.home} className={textLinkClassName}>
                    {t("ui.nav.backToLogin")}
                  </Link>
                </div>
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
      </main>
    </div>
  );
}
