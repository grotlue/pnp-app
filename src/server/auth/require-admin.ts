import {
  type RequestDiagnostics,
  finalizeDiagnosticsResponse,
  measureDiagnostic,
} from "@/lib/api/diagnostics";
import { jsonError } from "@/lib/api/http";
import { requireAuth, type AuthContext } from "@/server/auth/require-auth";

export async function requireAdmin(
  request: Request,
  diagnostics?: RequestDiagnostics,
): Promise<{ context: AuthContext } | { response: Response }> {
  try {
    const auth = await requireAuth(request, diagnostics);
    if ("response" in auth) {
      return auth;
    }

    const { data: profile, error } = await measureDiagnostic(
      diagnostics,
      "auth.adminRole",
      () =>
        auth.context.client
          .from("profiles")
          .select("role")
          .eq("id", auth.context.user.id)
          .maybeSingle(),
    );

    if (error) {
      const response = jsonError(500, "admin_check_failed", error.message);
      return {
        response: diagnostics ? finalizeDiagnosticsResponse(diagnostics, response) : response,
      };
    }

    if (!profile || profile.role !== "admin") {
      const response = jsonError(403, "admin_required", "Admin access required");
      return {
        response: diagnostics ? finalizeDiagnosticsResponse(diagnostics, response) : response,
      };
    }

    return { context: auth.context };
  } catch (error) {
    console.warn("requireAdmin failed", error);
    const response = jsonError(
      500,
      "admin_check_failed",
      "Admin check failed",
    );
    return {
      response: diagnostics ? finalizeDiagnosticsResponse(diagnostics, response) : response,
    };
  }
}
