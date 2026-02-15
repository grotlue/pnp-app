import { createClient } from "@supabase/supabase-js";
import { getSupabaseUrl } from "@/lib/supabase/config";

function getServiceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error("Missing environment variable: SUPABASE_SERVICE_ROLE_KEY");
  }
  return key;
}

export function createServiceRoleSupabaseClient() {
  return createClient(getSupabaseUrl(), getServiceRoleKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
