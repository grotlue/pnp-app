import { jsonError } from "@/lib/api/http";
import { requireAuth, type AuthContext } from "@/server/auth/require-auth";

export async function requireAdmin(
  request: Request,
): Promise<{ context: AuthContext } | { response: Response }> {
  const auth = await requireAuth(request);
  if ("response" in auth) {
    return auth;
  }

  const { data: profile, error } = await auth.context.client
    .from("profiles")
    .select("role")
    .eq("id", auth.context.user.id)
    .single();

  if (error) {
    return {
      response: jsonError(500, "admin_check_failed", error.message),
    };
  }

  if (!profile || profile.role !== "admin") {
    return {
      response: jsonError(403, "admin_required", "Admin access required"),
    };
  }

  return { context: auth.context };
}
