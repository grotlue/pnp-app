import type { ClientSession } from "@/lib/client/session";
import { apiRequest } from "@/lib/client/api";
import type { MeResponse } from "../types";

export async function getMyUserQuery(
  session: ClientSession,
): Promise<MeResponse> {
  const response = await apiRequest<MeResponse>("/api/me", { session });
  if (response.error || !response.data) {
    throw new Error(response.error?.message ?? "Failed to load user");
  }
  return response.data;
}
