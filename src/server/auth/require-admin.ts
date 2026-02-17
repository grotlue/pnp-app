import { jsonError } from "@/lib/api/http";
import {
  hasAal2AuthLevel,
  isAdminMfaRequired,
} from "@/server/auth/auth-hardening";
import { getUserRole } from "@/server/auth/get-user-role";
import { requireAuth, type AuthContext } from "@/server/auth/require-auth";

export async function requireAdmin(
  request: Request,
): Promise<{ context: AuthContext } | { response: Response }> {
  try {
    const auth = await requireAuth(request);
    if ("response" in auth) {
      return auth;
    }

    const roleResult = await getUserRole(auth.context);
    if (roleResult.errorMessage) {
      return {
        response: jsonError(500, "admin_check_failed", roleResult.errorMessage),
      };
    }

    if (roleResult.role !== "admin") {
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
      response: jsonError(500, "admin_check_failed", "Admin check failed"),
    };
  }
}
