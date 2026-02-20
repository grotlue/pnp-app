import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/config";

let client: SupabaseClient | null = null;

const createSupabaseBrowserClient = () => {
  if (client) {
    return client;
  }

  client = createBrowserClient(getSupabaseUrl(), getSupabaseAnonKey());
  return client;
};

export { createSupabaseBrowserClient as default, createSupabaseBrowserClient };
