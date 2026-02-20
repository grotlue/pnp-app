import { jsonError, jsonOk, parseJsonBody } from "@/lib/api/http";
import {
  normalizeAndValidateEmail,
  validatePasswordStrength,
} from "@/lib/api/auth-validation";
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

const getProfileRole = async (
  service: ReturnType<typeof createServiceRoleSupabaseClient>,
  userId: string,
) => {
  const { data, error } = await service
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    return { ok: false as const, errorMessage: error.message };
  }

  return { ok: true as const, role: data?.role as "admin" | "user" | null };
};

const PATCH = async (request: Request, { params }: Params) => {
  const admin = await requireAdmin(request);
  if ("response" in admin) {
    return admin.response;
  }

  const { userId } = await params;
  const body = await parseJsonBody<UpdateAdminUserBody>(request);
  if (!body) {
    return jsonError(400, "invalid_payload", "invalid JSON body");
  }

  let service: ReturnType<typeof createServiceRoleSupabaseClient>;
  try {
    service = createServiceRoleSupabaseClient();
  } catch (error) {
    console.warn(
      "admin user update failed: missing service role client",
      error,
    );
    return jsonError(500, "admin_user_update_failed", "Failed to update user");
  }

  const targetRole = await getProfileRole(service, userId);
  if (!targetRole.ok) {
    return jsonError(400, "admin_user_update_failed", targetRole.errorMessage);
  }

  if (targetRole.role === "admin") {
    return jsonError(
      403,
      "admin_user_update_forbidden",
      "Admin accounts cannot be edited",
    );
  }

  if (body.email !== undefined) {
    const email = normalizeAndValidateEmail(body.email);
    if (!email) {
      return jsonError(400, "invalid_payload", "valid email is required");
    }
    body.email = email;
  }

  if (body.password !== undefined) {
    const passwordError = validatePasswordStrength(body.password);
    if (passwordError) {
      return jsonError(400, "invalid_payload", passwordError);
    }
  }

  if (body.email || body.password) {
    const { error: authError } = await service.auth.admin.updateUserById(
      userId,
      {
        email: body.email,
        password: body.password,
      },
    );

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
};

const DELETE = async (request: Request, { params }: Params) => {
  const admin = await requireAdmin(request);
  if ("response" in admin) {
    return admin.response;
  }

  const { userId } = await params;
  const roleClient = (() => {
    try {
      return createServiceRoleSupabaseClient();
    } catch {
      return admin.context.client;
    }
  })();
  const targetRole = await getProfileRole(roleClient, userId);
  if (!targetRole.ok) {
    return jsonError(400, "admin_delete_failed", targetRole.errorMessage);
  }

  if (targetRole.role === "admin" || userId === admin.context.user.id) {
    return jsonError(
      403,
      "admin_delete_failed",
      "Admin accounts cannot be deleted",
    );
  }

  const { error } = await admin.context.client.rpc("rpc_admin_delete_user", {
    p_user_id: userId,
  });

  if (error) {
    return jsonError(403, "admin_delete_failed", error.message);
  }

  return jsonOk({ deleted: true });
};

export { DELETE, PATCH };
