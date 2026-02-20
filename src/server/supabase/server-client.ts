import { createClient } from "@supabase/supabase-js";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/config";

const getBaseServerAuthOptions = () => {
  return {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  } as const;
};

const createServerSupabaseClient = () => {
  const supabaseUrl = getSupabaseUrl();
  const supabaseAnonKey = getSupabaseAnonKey();

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: getBaseServerAuthOptions(),
  });
};

const createServerSupabaseUserClient = (accessToken: string) => {
  const supabaseUrl = getSupabaseUrl();
  const supabaseAnonKey = getSupabaseAnonKey();

  return createClient(supabaseUrl, supabaseAnonKey, {
    accessToken: async () => accessToken,
    auth: getBaseServerAuthOptions(),
  });
};

const createServerSupabaseUserAuthClient = (accessToken: string) => {
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
};

export {
  createServerSupabaseClient,
  createServerSupabaseUserAuthClient,
  createServerSupabaseUserClient,
};
