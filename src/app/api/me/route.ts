import {
  createRequestDiagnostics,
  finalizeDiagnosticsResponse,
  measureDiagnostic,
} from "@/lib/api/diagnostics";
import { requireAuth } from "@/server/auth/require-auth";
import { jsonError, jsonOk } from "@/lib/api/http";

export async function GET(request: Request) {
  const diagnostics = createRequestDiagnostics(request, "GET /api/me");
  const auth = await requireAuth(request, diagnostics);
  if ("response" in auth) {
    return auth.response;
  }

  const { client, user } = auth.context;
  const { data: profile, error } = await measureDiagnostic(
    diagnostics,
    "db.profile.selectMe",
    () =>
      client
        .from("profiles")
        .select("id, username, description, avatar_path, role, locale, created_at, updated_at")
        .eq("id", user.id)
        .single(),
  );

  if (error) {
    return finalizeDiagnosticsResponse(
      diagnostics,
      jsonError(500, "profile_fetch_failed", error.message),
    );
  }

  return finalizeDiagnosticsResponse(diagnostics, jsonOk({ user, profile }));
}

export async function DELETE(request: Request) {
  const diagnostics = createRequestDiagnostics(request, "DELETE /api/me");
  const auth = await requireAuth(request, diagnostics);
  if ("response" in auth) {
    return auth.response;
  }

  const { client, user } = auth.context;
  const { error } = await measureDiagnostic(diagnostics, "db.rpc.deleteUser", () =>
    client.rpc("rpc_delete_user_phase1", {
      p_user_id: user.id,
    }),
  );

  if (error) {
    return finalizeDiagnosticsResponse(
      diagnostics,
      jsonError(400, "user_delete_failed", error.message),
    );
  }

  return finalizeDiagnosticsResponse(diagnostics, jsonOk({ deleted: true }));
}
