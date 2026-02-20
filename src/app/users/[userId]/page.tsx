import { getRequestLocale } from "@/lib/i18n/request-locale";
import UserProfilePageView from "@/page-modules/user-profile-page";

type UserProfilePageProps = {
  params: Promise<{ userId: string }>;
};

export default async function UserProfilePage({
  params,
}: UserProfilePageProps) {
  const locale = await getRequestLocale();
  const { userId } = await params;

  return <UserProfilePageView locale={locale} userId={userId} />;
}
