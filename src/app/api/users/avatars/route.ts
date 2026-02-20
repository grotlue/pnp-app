import { jsonError, jsonOk } from "@/lib/api/http";
import { requireAuth } from "@/server/auth/require-auth";

type ProfileAvatarRow = {
  id: string;
  username: string;
  avatar_path: string | null;
  role: "user" | "admin" | null;
};

type SignedUrlRow = {
  path: string;
  signedUrl?: string;
};

export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if ("response" in auth) {
    return auth.response;
  }

  const url = new URL(request.url);
  const limitParam = Number(url.searchParams.get("limit") ?? "200");
  const limit = Number.isFinite(limitParam)
    ? Math.min(Math.max(limitParam, 1), 1000)
    : 200;

  const { data, error } = await auth.context.client
    .from("profiles")
    .select("id, username, avatar_path, role")
    .limit(limit)
    .order("username", { ascending: true });

  if (error) {
    return jsonError(400, "users_avatar_list_failed", error.message);
  }

  const profiles = ((data ?? []) as ProfileAvatarRow[]).filter(
    (profile) => profile.role !== "admin",
  );
  const avatarPaths = profiles.flatMap((profile) =>
    profile.avatar_path ? [profile.avatar_path] : [],
  );

  const signedUrlByPath = new Map<string, string>();
  if (avatarPaths.length > 0) {
    const { data: signedUrls, error: signedUrlsError } =
      await auth.context.authClient.storage
        .from("profile-images")
        .createSignedUrls(avatarPaths, 60 * 10);

    if (signedUrlsError) {
      return jsonError(
        400,
        "profile_image_signed_urls_failed",
        signedUrlsError.message,
      );
    }

    for (const entry of (signedUrls ?? []) as SignedUrlRow[]) {
      if (entry.path && typeof entry.signedUrl === "string") {
        signedUrlByPath.set(entry.path, entry.signedUrl);
      }
    }
  }

  return jsonOk(
    profiles.map((profile) => ({
      id: profile.id,
      username: profile.username,
      avatarPath: profile.avatar_path,
      avatarUrl: profile.avatar_path
        ? (signedUrlByPath.get(profile.avatar_path) ?? null)
        : null,
    })),
  );
}
