import { createClient } from "@supabase/supabase-js";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/config";

let browserSupabaseClient: ReturnType<typeof createClient> | null = null;

export function getBrowserSupabaseClient() {
  if (browserSupabaseClient) {
    return browserSupabaseClient;
  }

  browserSupabaseClient = createClient(getSupabaseUrl(), getSupabaseAnonKey());

  return browserSupabaseClient;
}
