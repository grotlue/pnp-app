"use client";

import { AspectRatio } from "@/components/ui/aspect-ratio";
import { AvatarImage } from "@/components/ui/avatar-image";
import { EmptyState } from "@/components/ui/empty-state";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { UiDiv } from "@/components/ui/html-elements";
import { ListItemRow } from "@/components/ui/list-item-row";
import { PageLoadingState } from "@/components/ui/page-loading-state";
import { AppPageMain, PageViewport } from "@/components/ui/page-shell";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { TextLink } from "@/components/ui/text-link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { appRoutes } from "@/app/router";
import { getUsersAvatarList } from "@/features/users/queries/users-avatar-list.query";
import { queryKeys } from "@/lib/client/query-keys";
import { useClientSession } from "@/lib/client/use-client-session";
import { getTranslator, type AppLocale } from "@/lib/i18n/index";
import { hasItems } from "@/lib/logic/collections";
import {
  clampListPage,
  DEFAULT_LIST_PAGE_SIZE,
  paginateListItems,
} from "@/lib/utils/list";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type UsersAvatarsPageViewProps = {
  locale: AppLocale;
};

export function UsersAvatarsPageView({ locale }: UsersAvatarsPageViewProps) {
  const t = useMemo(() => getTranslator(locale), [locale]);
  const router = useRouter();
  const { session, ready } = useClientSession();
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!ready) {
      return;
    }

    if (!session) {
      router.replace(appRoutes.home);
    }
  }, [ready, router, session]);

  const usersAvatarListQuery = useQuery({
    queryKey: queryKeys.usersAvatarList(session?.accessToken ?? "no-session"),
    enabled: Boolean(session),
    staleTime: 240_000,
    queryFn: async () => {
      if (!session) {
        throw new Error("Missing session");
      }

      return getUsersAvatarList(session);
    },
  });

  if (!ready || !session) {
    return <PageViewport />;
  }

  if (usersAvatarListQuery.isLoading) {
    return (
      <AppPageMain maxWidth="7xl">
        <PageLoadingState label={t("ui.loading.page")} />
      </AppPageMain>
    );
  }

  const usersAvatarList = usersAvatarListQuery.data ?? [];
  const safePage = clampListPage(
    page,
    usersAvatarList.length,
    DEFAULT_LIST_PAGE_SIZE,
  );
  const pagedUsersAvatarList = paginateListItems(
    usersAvatarList,
    safePage,
    DEFAULT_LIST_PAGE_SIZE,
  );

  const errorMessage =
    usersAvatarListQuery.error instanceof Error
      ? usersAvatarListQuery.error.message
      : "";

  return (
    <AppPageMain maxWidth="7xl">
      <Card>
        <CardHeader>
          <CardTitle>{t("ui.usersAvatars.title")}</CardTitle>
          <CardDescription>{t("ui.usersAvatars.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent stack={4}>
          <FeedbackMessage message={errorMessage} />

          <UiDiv stack={2}>
            {pagedUsersAvatarList.map((user) => (
              <ListItemRow key={user.id}>
                <UiDiv stack={1}>
                  <UiDiv surface="avatar-frame">
                    {user.avatarUrl ? (
                      <AvatarImage src={user.avatarUrl} alt={user.username} />
                    ) : (
                      <AspectRatio ratio={1}>
                        <UiDiv surface="avatar-fallback">
                          {t("ui.usersAvatars.fallback")}
                        </UiDiv>
                      </AspectRatio>
                    )}
                  </UiDiv>
                  <TextLink href={`/users/${user.id}`}>
                    {user.username}
                  </TextLink>
                </UiDiv>
              </ListItemRow>
            ))}
            {!hasItems(usersAvatarList) ? (
              <EmptyState label={t("ui.feedback.empty")} />
            ) : null}
          </UiDiv>

          <PaginationControls
            page={safePage}
            pageSize={DEFAULT_LIST_PAGE_SIZE}
            totalItems={usersAvatarList.length}
            previousLabel={t("ui.list.previous")}
            nextLabel={t("ui.list.next")}
            pageLabel={t("ui.list.page")}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>
    </AppPageMain>
  );
}
