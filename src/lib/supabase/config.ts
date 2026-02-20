const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
};

const getSupabaseUrl = (): string => {
  return requireEnv("NEXT_PUBLIC_SUPABASE_URL");
};

const getSupabaseAnonKey = (): string => {
  return requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
};

export { getSupabaseAnonKey, getSupabaseUrl };
