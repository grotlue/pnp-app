import { createClient } from "@supabase/supabase-js";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/config";

function getBaseServerAuthOptions() {
  return {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  } as const;
}

export function createServerSupabaseClient() {
  const supabaseUrl = getSupabaseUrl();
  const supabaseAnonKey = getSupabaseAnonKey();

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: getBaseServerAuthOptions(),
  });
}

export function createServerSupabaseUserClient(accessToken: string) {
  const supabaseUrl = getSupabaseUrl();
  const supabaseAnonKey = getSupabaseAnonKey();

  return createClient(supabaseUrl, supabaseAnonKey, {
    accessToken: async () => accessToken,
    auth: getBaseServerAuthOptions(),
  });
}

export function createServerSupabaseUserAuthClient(accessToken: string) {
  const supabaseUrl = getSupabaseUrl();
  const supabaseAnonKey = getSupabaseAnonKey();

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: getBaseServerAuthOptions(),
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}
