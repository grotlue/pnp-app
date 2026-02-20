import { apiRequest, unwrapApiResponse } from "@/lib/client/api";
import type { ClientSession } from "@/lib/client/session";
import type { MeResponse } from "../types";

const getMe = async (session: ClientSession): Promise<MeResponse> => {
  const response = await apiRequest<MeResponse>("/api/me", { session });
  return unwrapApiResponse(response, "Failed to load profile");
};

const updateMyProfile = async (
  session: ClientSession,
  input: {
    username: string;
    description: string;
    locale: "en" | "de";
    avatarPath?: string | null;
  },
): Promise<{ username: string }> => {
  const response = await apiRequest<{ username: string }>("/api/me/profile", {
    method: "PATCH",
    session,
    body: input,
  });
  return unwrapApiResponse(response, "Failed to save profile");
};

const createProfileAvatarSignedUpload = async (
  session: ClientSession,
  input: {
    fileName: string;
    width: number;
    height: number;
    fileSize: number;
  },
): Promise<{ token: string; signedUrl: string; path: string }> => {
  const response = await apiRequest<{
    token: string;
    signedUrl: string;
    path: string;
  }>("/api/storage/profile-images/signed-upload", {
    method: "POST",
    session,
    body: input,
  });
  return unwrapApiResponse(response, "Failed to prepare profile image upload");
};

const getProfileAvatarSignedUrl = async (
  session: ClientSession,
  path: string,
): Promise<{ signedUrl: string }> => {
  const response = await apiRequest<{ signedUrl: string }>(
    "/api/storage/profile-images/signed-url",
    {
      method: "POST",
      session,
      body: {
        path,
        expiresIn: 600,
      },
    },
  );
  return unwrapApiResponse(response, "Failed to load profile image");
};

export {
  createProfileAvatarSignedUpload,
  getMe,
  getProfileAvatarSignedUrl,
  updateMyProfile,
};
