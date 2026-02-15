import { getRequestLocale } from "@/lib/i18n/request-locale";
import { AdminPageView } from "@/page-modules/admin-page";

export default async function AdminPage() {
  const locale = await getRequestLocale();
  return <AdminPageView locale={locale} />;
}
