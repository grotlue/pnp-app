"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/common/app-header";
import { FeedbackMessage } from "@/components/common/feedback-message";
import { FormInput, FormSelect, FormTextarea } from "@/components/common/form-controls";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { setLocaleCookie } from "@/lib/client/locale-cookie";
import { useClientSession } from "@/lib/client/use-client-session";
import { getTranslator, type AppLocale } from "@/lib/i18n/index";
import { isAdmin } from "@/features/users/logic/role.logic";
import { getMe, updateMyProfile } from "@/features/users/queries/users-profile.query";
import type { MeResponse } from "@/features/users/types";

type ProfileScreenProps = {
  locale: AppLocale;
};

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
      if (isAdmin(response.profile.role)) {
        router.replace("/admin/users");
        return;
      }
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
      setLocaleCookie(form.locale as "en" | "de");
      router.refresh();
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
            <FormInput
              value={form.username}
              placeholder={t("ui.fields.username")}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, username: event.target.value }))
              }
            />
            <FormSelect
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
            </FormSelect>
            <FormTextarea
              className="min-h-24"
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
            <FeedbackMessage message={message} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
