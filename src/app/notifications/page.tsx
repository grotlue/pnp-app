import NotificationsPageView from "@/page-modules/notifications-page";
import { getRequestLocale } from "@/lib/i18n/request-locale";

export default async function NotificationsPage() {
  const locale = await getRequestLocale();
  return <NotificationsPageView locale={locale} />;
}
