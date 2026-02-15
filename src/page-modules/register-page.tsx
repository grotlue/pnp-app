"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getTranslator, type AppLocale } from "@/lib/i18n/index";
import { registerUser } from "@/features/users/queries/users-auth.query";

type RegisterScreenProps = {
  locale: AppLocale;
};

const fieldClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";

export function RegisterPageView({ locale }: RegisterScreenProps) {
  const t = useMemo(() => getTranslator(locale), [locale]);
  const router = useRouter();

  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });

  async function onSubmit() {
    setBusy(true);
    setMessage("");
    try {
      await registerUser({
        ...form,
        locale,
      });
      router.push("/?registered=1");
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
            <CardTitle>{t("ui.register.title")}</CardTitle>
            <CardDescription>{t("ui.register.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <input
              className={fieldClass}
              placeholder={t("ui.fields.username")}
              value={form.username}
              onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))}
            />
            <input
              className={fieldClass}
              type="email"
              placeholder={t("ui.fields.email")}
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            />
            <input
              className={fieldClass}
              type="password"
              placeholder={t("ui.fields.password")}
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            />
            {message ? (
              <div className="rounded-md border border-border bg-background p-2 text-xs">
                {message}
              </div>
            ) : null}
          </CardContent>
          <CardFooter className="flex-col items-stretch gap-2">
            <Button disabled={busy} onClick={onSubmit}>
              {t("ui.actions.register")}
            </Button>
            <div className="text-xs">
              <Link className="underline" href="/">
                {t("ui.register.alreadyRegistered")}
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
