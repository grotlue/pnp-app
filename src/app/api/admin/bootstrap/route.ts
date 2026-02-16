import {
  createRequestDiagnostics,
  finalizeDiagnosticsResponse,
  measureDiagnostic,
  type RequestDiagnostics,
} from "@/lib/api/diagnostics";
import { jsonError, jsonOk } from "@/lib/api/http";
import { requireAdmin } from "@/server/auth/require-admin";
import { createServiceRoleSupabaseClient } from "@/server/supabase/service-role-client";

async function listAllAuthUsers(
  service: ReturnType<typeof createServiceRoleSupabaseClient>,
  diagnostics?: RequestDiagnostics,
) {
  const users: Array<{ id: string; email?: string | null }> = [];
  let page = 1;

  while (true) {
    const { data, error } = await measureDiagnostic(
      diagnostics,
      "db.authAdmin.listUsersPage",
      () => service.auth.admin.listUsers({ page, perPage: 1000 }),
    );
    if (error) {
      return { ok: false as const, errorMessage: error.message };
    }

    users.push(
      ...(data?.users ?? []).map((user) => ({
        id: user.id,
        email: user.email ?? null,
      })),
    );

    if (!data?.nextPage) {
      break;
    }
    page = data.nextPage;
  }

  return { ok: true as const, users };
}

export async function GET(request: Request) {
  const diagnostics = createRequestDiagnostics(request, "GET /api/admin/bootstrap");
  const admin = await requireAdmin(request, diagnostics);
  if ("response" in admin) {
    return admin.response;
  }

  const service = (() => {
    try {
      return createServiceRoleSupabaseClient();
    } catch {
      return null;
    }
  })();

  const dataClient = service ?? admin.context.client;

  const [meResult, profilesResult, campaignsResult, charactersResult, authUsersResult] =
    await Promise.all([
      measureDiagnostic(diagnostics, "db.profiles.selectAdminMe", () =>
        admin.context.client
          .from("profiles")
          .select("id, username, description, avatar_path, role, locale, created_at, updated_at")
          .eq("id", admin.context.user.id)
          .single(),
      ),
      measureDiagnostic(diagnostics, "db.profiles.listAll", () =>
        dataClient
          .from("profiles")
          .select("id, username, description, role, locale, created_at, updated_at")
          .order("created_at", { ascending: false }),
      ),
      measureDiagnostic(diagnostics, "db.campaigns.listAll", () =>
        dataClient
          .from("campaigns")
          .select("id, owner_user_id, title, description, is_private, created_at, updated_at")
          .order("created_at", { ascending: false })
          .limit(500),
      ),
      measureDiagnostic(diagnostics, "db.characters.listAll", () =>
        dataClient
          .from("characters")
          .select(
            "id, owner_user_id, campaign_id, type, name, age, description, avatar_path, is_private, created_at, updated_at",
          )
          .order("created_at", { ascending: false })
          .limit(500),
      ),
      service
        ? listAllAuthUsers(service, diagnostics)
        : Promise.resolve({ ok: true as const, users: [] as Array<{ id: string; email?: string | null }> }),
    ]);

  if (meResult.error || !meResult.data) {
    return finalizeDiagnosticsResponse(
      diagnostics,
      jsonError(500, "admin_bootstrap_failed", meResult.error?.message ?? "Failed to load profile"),
    );
  }

  if (profilesResult.error) {
    return finalizeDiagnosticsResponse(
      diagnostics,
      jsonError(400, "admin_bootstrap_failed", profilesResult.error.message),
    );
  }
  if (campaignsResult.error) {
    return finalizeDiagnosticsResponse(
      diagnostics,
      jsonError(400, "admin_bootstrap_failed", campaignsResult.error.message),
    );
  }
  if (charactersResult.error) {
    return finalizeDiagnosticsResponse(
      diagnostics,
      jsonError(400, "admin_bootstrap_failed", charactersResult.error.message),
    );
  }
  if (!authUsersResult.ok) {
    return finalizeDiagnosticsResponse(
      diagnostics,
      jsonError(400, "admin_bootstrap_failed", authUsersResult.errorMessage),
    );
  }

  const emailByUserId = new Map(authUsersResult.users.map((user) => [user.id, user.email ?? ""]));
  const users = (profilesResult.data ?? []).map((profile) => ({
    ...profile,
    email: emailByUserId.get(profile.id) ?? "",
  }));

  return finalizeDiagnosticsResponse(
    diagnostics,
    jsonOk({
      me: {
        user: {
          id: admin.context.user.id,
          email: admin.context.user.email,
        },
        profile: meResult.data,
      },
      users,
      campaigns: campaignsResult.data ?? [],
      characters: charactersResult.data ?? [],
    }),
  );
}
