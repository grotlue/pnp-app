import { apiRequest, unwrapApiResponse } from "@/lib/client/api";
import type { ClientSession } from "@/lib/client/session";
import type { MeResponse } from "../types";

export async function getMe(session: ClientSession): Promise<MeResponse> {
  const response = await apiRequest<MeResponse>("/api/me", { session });
  return unwrapApiResponse(response, "Failed to load profile");
}

export async function updateMyProfile(
  session: ClientSession,
  input: {
    username: string;
    description: string;
    locale: "en" | "de";
  },
): Promise<{ username: string }> {
  const response = await apiRequest<{ username: string }>("/api/me/profile", {
    method: "PATCH",
    session,
    body: input,
  });
  return unwrapApiResponse(response, "Failed to save profile");
}
