import { jsonError, jsonOk, parseJsonBody } from "@/lib/api/http";
import { requireAdmin } from "@/server/auth/require-admin";
import { createServiceRoleSupabaseClient } from "@/server/supabase/service-role-client";

type Params = {
  params: Promise<{
    userId: string;
  }>;
};

type UpdateAdminUserBody = {
  email?: string;
  password?: string;
  username?: string;
  description?: string;
  locale?: "en" | "de";
};

export async function PATCH(request: Request, { params }: Params) {
  const admin = await requireAdmin(request);
  if ("response" in admin) {
    return admin.response;
  }

  const { userId } = await params;
  const body = await parseJsonBody<UpdateAdminUserBody>(request);
  if (!body) {
    return jsonError(400, "invalid_payload", "invalid JSON body");
  }

  const service = createServiceRoleSupabaseClient();

  if (body.email || body.password) {
    const { error: authError } = await service.auth.admin.updateUserById(userId, {
      email: body.email,
      password: body.password,
    });

    if (authError) {
      return jsonError(400, "admin_user_update_failed", authError.message);
    }
  }

  const patch: Record<string, unknown> = {};
  if (body.username !== undefined) {
    patch.username = body.username;
  }
  if (body.description !== undefined) {
    patch.description = body.description;
  }
  if (body.locale !== undefined) {
    patch.locale = body.locale;
  }

  if (Object.keys(patch).length > 0) {
    patch.updated_at = new Date().toISOString();
    const { error: profileError } = await service
      .from("profiles")
      .update(patch)
      .eq("id", userId);

    if (profileError) {
      return jsonError(400, "admin_user_update_failed", profileError.message);
    }
  }

  return jsonOk({ updated: true });
}

export async function DELETE(request: Request, { params }: Params) {
  const admin = await requireAdmin(request);
  if ("response" in admin) {
    return admin.response;
  }

  const { userId } = await params;
  if (userId === admin.context.user.id) {
    return jsonError(400, "admin_delete_failed", "Admin cannot delete own account");
  }

  const { error } = await admin.context.client.rpc("rpc_admin_delete_user", {
    p_user_id: userId,
  });

  if (error) {
    return jsonError(403, "admin_delete_failed", error.message);
  }

  return jsonOk({ deleted: true });
}
