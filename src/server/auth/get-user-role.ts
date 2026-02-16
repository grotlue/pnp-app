import type { AuthContext } from "@/server/auth/require-auth";

export type AppUserRole = "admin" | "user" | null;

export async function getUserRole(
  context: Pick<AuthContext, "client" | "user">,
): Promise<{ role: AppUserRole; errorMessage?: string }> {
  const { data, error } = await context.client
    .from("profiles")
    .select("role")
    .eq("id", context.user.id)
    .maybeSingle();

  if (error) {
    return { role: null, errorMessage: error.message };
  }

  if (data?.role === "admin" || data?.role === "user") {
    return { role: data.role };
  }

  return { role: null };
}
