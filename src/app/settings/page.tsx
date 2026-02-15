import { SettingsPageView } from "@/page-modules/settings-page";
import { getRequestLocale } from "@/lib/i18n/request-locale";

export default async function SettingsPage() {
  const locale = await getRequestLocale();
  return <SettingsPageView locale={locale} />;
}
