import { jsonError } from "@/lib/api/http";
import { hasAal2AuthLevel, isAdminMfaRequired } from "@/server/auth/auth-hardening";
import { requireAuth, type AuthContext } from "@/server/auth/require-auth";

export async function requireAdmin(
  request: Request,
  _diagnostics?: unknown,
): Promise<{ context: AuthContext } | { response: Response }> {
  try {
    const auth = await requireAuth(request);
    if ("response" in auth) {
      return auth;
    }

    const { data: profile, error } = await auth.context.client
      .from("profiles")
      .select("role")
      .eq("id", auth.context.user.id)
      .maybeSingle();

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

    if (isAdminMfaRequired() && !hasAal2AuthLevel(auth.context.accessToken)) {
      return {
        response: jsonError(403, "admin_mfa_required", "Admin MFA is required"),
      };
    }

    return { context: auth.context };
  } catch (error) {
    console.warn("requireAdmin failed", error);
    return {
      response: jsonError(
        500,
        "admin_check_failed",
        "Admin check failed",
      ),
    };
  }
}
