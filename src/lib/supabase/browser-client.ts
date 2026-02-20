import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const getBrowserSupabaseClient = () => {
  return createSupabaseBrowserClient();
};

export { getBrowserSupabaseClient as default, getBrowserSupabaseClient };
