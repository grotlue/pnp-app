"use client";

import { UiDiv } from "@/components/ui/html-elements";
import { AppPageMain, PageViewport } from "@/components/ui/page-shell";

import { type ChangeEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import {
  FormInput,
  FormSelect,
  FormTextarea,
} from "@/components/ui/form-controls";
import ImageUploadField from "@/components/common/image-upload-field";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { uploadImageToSignedPath } from "@/lib/client/storage-upload";
import { setLocaleCookie } from "@/lib/client/locale-cookie";
import useClientSession from "@/lib/client/use-client-session";
import { type AppLocale, getTranslator } from "@/lib/i18n/index";
import {
  createProfileAvatarSignedUpload,
  getMe,
  getProfileAvatarSignedUrl,
  updateMyProfile,
} from "@/features/users/queries/users-profile.query";
import { isAdmin } from "@/features/users/logic/role.logic";
import type { MeResponse } from "@/features/users/types";

type ProfileScreenProps = {
  locale: AppLocale;
};

const ProfilePageView = ({ locale }: ProfileScreenProps) => {
  const t = getTranslator(locale);
  const router = useRouter();
  const { session, ready } = useClientSession();

  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    username: "",
    description: "",
    locale: locale,
    avatarPath: "",
  });

  useEffect(() => {
    if (!ready) {
      return;
    }
    if (!session) {
      router.replace("/");
      return;
    }
    const load = async () => {
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
          avatarPath: response.profile.avatar_path ?? "",
        });
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : t("ui.feedback.requestFailed"),
        );
      }
    };

    void load();
  }, [ready, router, session, t]);

  const uploadProfileImage = async (
    file: File,
    dimensions: { width: number; height: number },
  ) => {
    if (!session) {
      throw new Error("Missing session");
    }

    const signedUpload = await createProfileAvatarSignedUpload(session, {
      fileName: file.name,
      width: dimensions.width,
      height: dimensions.height,
      fileSize: file.size,
    });
    await uploadImageToSignedPath({
      bucket: "profile-images",
      path: signedUpload.path,
      token: signedUpload.token,
      file,
    });

    return { path: signedUpload.path };
  };

  const resolveProfileImagePreview = async (path: string) => {
    if (!session) {
      throw new Error("Missing session");
    }

    const response = await getProfileAvatarSignedUrl(session, path);
    return response.signedUrl;
  };

  const save = async () => {
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
        avatarPath: form.avatarPath || null,
      });
      setLocaleCookie(form.locale as "en" | "de");
      router.refresh();
      setMessage(t("ui.feedback.saved"));
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : t("ui.feedback.requestFailed"),
      );
    } finally {
      setBusy(false);
    }
  };

  const handleAvatarPathChange = (avatarPath: string) => {
    setForm((prev) => ({ ...prev, avatarPath }));
  };

  const handleUsernameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, username: event.target.value }));
  };

  const handleLocaleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setForm((prev) => ({
      ...prev,
      locale: event.target.value as "en" | "de",
    }));
  };

  const handleDescriptionChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setForm((prev) => ({
      ...prev,
      description: event.target.value,
    }));
  };

  if (!ready || !session) {
    return <PageViewport />;
  }

  return (
    <AppPageMain maxWidth="4xl">
      <Card>
        <CardHeader>
          <CardTitle>{t("ui.profile.title")}</CardTitle>
          <CardDescription>{t("ui.profile.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent stack={3}>
          <ImageUploadField
            value={form.avatarPath}
            label={t("ui.fields.profileImage")}
            previewAlt={t("ui.fields.profileImage")}
            hint={t("ui.imageUpload.hint")}
            emptyLabel={t("ui.imageUpload.empty")}
            uploadLabel={t("ui.imageUpload.upload")}
            replaceLabel={t("ui.imageUpload.replace")}
            removeLabel={t("ui.imageUpload.remove")}
            uploadingLabel={t("ui.imageUpload.uploading")}
            invalidTypeLabel={t("ui.imageUpload.invalidType")}
            invalidDimensionsLabel={t("ui.imageUpload.invalidDimensions")}
            invalidFileSizeLabel={t("ui.imageUpload.invalidFileSize")}
            disabled={busy}
            onChange={handleAvatarPathChange}
            onUpload={uploadProfileImage}
            onResolvePreviewUrl={resolveProfileImagePreview}
          />
          <FormInput
            value={form.username}
            placeholder={t("ui.fields.username")}
            onChange={handleUsernameChange}
          />
          <FormSelect value={form.locale} onChange={handleLocaleChange}>
            <option value="en">English</option>
            <option value="de">Deutsch</option>
          </FormSelect>
          <FormTextarea
            size="lg"
            value={form.description}
            placeholder={t("ui.fields.description")}
            onChange={handleDescriptionChange}
          />
          <UiDiv inlineGap={2}>
            <Button disabled={busy} onClick={save}>
              {t("ui.actions.save")}
            </Button>
          </UiDiv>
          <FeedbackMessage message={message} />
        </CardContent>
      </Card>
    </AppPageMain>
  );
};

export default ProfilePageView;
