import { jsonError, jsonOk, parseJsonBody } from "@/lib/api/http";
import { requireAdmin } from "@/server/auth/require-admin";
import { createServiceRoleSupabaseClient } from "@/server/supabase/service-role-client";

type CreateAdminUserBody = {
  email?: string;
  password?: string;
  username?: string;
  description?: string;
  locale?: "en" | "de";
};

async function listAllAuthUsers(service: ReturnType<typeof createServiceRoleSupabaseClient>) {
  const users: Array<{ id: string; email?: string | null }> = [];
  let page = 1;

  while (true) {
    const { data, error } = await service.auth.admin.listUsers({ page, perPage: 1000 });
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
  const admin = await requireAdmin(request);
  if ("response" in admin) {
    return admin.response;
  }

  const service = createServiceRoleSupabaseClient();
  const [{ data: profiles, error: profilesError }, authUsersResult] = await Promise.all([
    service
      .from("profiles")
      .select("id, username, description, role, locale, created_at, updated_at")
      .order("created_at", { ascending: false }),
    listAllAuthUsers(service),
  ]);

  if (profilesError) {
    return jsonError(400, "admin_users_list_failed", profilesError.message);
  }

  if (!authUsersResult.ok) {
    return jsonError(400, "admin_users_list_failed", authUsersResult.errorMessage);
  }

  const emailByUserId = new Map(
    authUsersResult.users.map((user) => [user.id, user.email ?? ""]),
  );

  const data = (profiles ?? []).map((profile) => ({
    ...profile,
    email: emailByUserId.get(profile.id) ?? "",
  }));

  return jsonOk(data);
}

export async function POST(request: Request) {
  const admin = await requireAdmin(request);
  if ("response" in admin) {
    return admin.response;
  }

  const body = await parseJsonBody<CreateAdminUserBody>(request);
  if (!body?.email || !body.password || !body.username) {
    return jsonError(400, "invalid_payload", "email, password, and username are required");
  }

  const locale = body.locale === "de" ? "de" : "en";
  const service = createServiceRoleSupabaseClient();

  const { data: authData, error: authError } = await service.auth.admin.createUser({
    email: body.email,
    password: body.password,
    email_confirm: true,
    user_metadata: {
      username: body.username,
    },
  });

  if (authError || !authData.user) {
    return jsonError(400, "admin_user_create_failed", authError?.message ?? "Failed to create user");
  }

  const { error: profileError } = await service.from("profiles").upsert(
    {
      id: authData.user.id,
      username: body.username,
      description: body.description ?? "",
      locale,
      role: "user",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  if (profileError) {
    return jsonError(400, "admin_user_create_failed", profileError.message);
  }

  return jsonOk({ userId: authData.user.id }, 201);
}
