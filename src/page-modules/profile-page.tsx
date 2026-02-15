"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AppHeader } from "@/components/common/app-header";
import { useClientSession } from "@/lib/client/use-client-session";
import { getTranslator, type AppLocale } from "@/lib/i18n/index";
import { getMe, updateMyProfile } from "@/features/users/queries/users-profile.query";
import type { MeResponse } from "@/features/users/types";

type ProfileScreenProps = {
  locale: AppLocale;
};

const fieldClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";

export function ProfilePageView({ locale }: ProfileScreenProps) {
  const t = useMemo(() => getTranslator(locale), [locale]);
  const router = useRouter();
  const { session, ready } = useClientSession();

  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    username: "",
    description: "",
    locale: locale,
  });

  useEffect(() => {
    if (!ready) {
      return;
    }
    if (!session) {
      router.replace("/");
      return;
    }
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, session]);

  async function load() {
    if (!session) {
      return;
    }
    try {
      const response: MeResponse = await getMe(session);
      setForm({
        username: response.profile.username,
        description: response.profile.description,
        locale: response.profile.locale,
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("ui.feedback.requestFailed"));
      return;
    }
  }

  async function save() {
    if (!session) {
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      await updateMyProfile(session, {
        username: form.username,
        description: form.description,
        locale: form.locale as "en" | "de",
      });
      setMessage(t("ui.feedback.saved"));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("ui.feedback.requestFailed"));
    } finally {
      setBusy(false);
    }
  }

  if (!ready || !session) {
    return <main className="min-h-screen" />;
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(130deg,oklch(0.96_0.04_76),oklch(0.98_0.01_180)_40%,oklch(0.95_0.05_138))]">
      <AppHeader locale={locale} session={session} />
      <main className="mx-auto w-full max-w-4xl px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>{t("ui.profile.title")}</CardTitle>
            <CardDescription>{t("ui.profile.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <input
              className={fieldClass}
              value={form.username}
              placeholder={t("ui.fields.username")}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, username: event.target.value }))
              }
            />
            <select
              className={fieldClass}
              value={form.locale}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  locale: event.target.value as "en" | "de",
                }))
              }
            >
              <option value="en">English</option>
              <option value="de">Deutsch</option>
            </select>
            <textarea
              className={`${fieldClass} min-h-24`}
              value={form.description}
              placeholder={t("ui.fields.description")}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, description: event.target.value }))
              }
            />
            <div className="flex gap-2">
              <Button disabled={busy} onClick={save}>
                {t("ui.actions.save")}
              </Button>
            </div>
            {message ? (
              <div className="rounded-md border border-border bg-background p-2 text-xs">
                {message}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
