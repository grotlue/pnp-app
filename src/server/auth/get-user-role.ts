import type { AuthContext } from "@/server/auth/require-auth";
import { createServiceRoleSupabaseClient } from "@/server/supabase/service-role-client";

export type AppUserRole = "admin" | "user" | null;

type RoleLookupClient = Pick<AuthContext["client"], "from">;

async function readUserRole(
  client: RoleLookupClient,
  userId: string,
): Promise<{ role: AppUserRole; errorMessage?: string }> {
  const { data, error } = await client
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    return { role: null, errorMessage: error.message };
  }

  if (data?.role === "admin" || data?.role === "user") {
    return { role: data.role };
  }

  return { role: null };
}

export async function getUserRole(
  context: Pick<AuthContext, "client" | "user">,
): Promise<{ role: AppUserRole; errorMessage?: string }> {
  const profileRole = await readUserRole(context.client, context.user.id);
  if (!profileRole.errorMessage) {
    return profileRole;
  }

  try {
    const serviceClient = createServiceRoleSupabaseClient();
    const fallbackRole = await readUserRole(serviceClient, context.user.id);
    if (!fallbackRole.errorMessage) {
      return fallbackRole;
    }
  } catch {
    // Fall through and return the original profile-query error.
  }

  return profileRole;
}
