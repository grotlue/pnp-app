import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function getBrowserSupabaseClient() {
  return createSupabaseBrowserClient();
}
