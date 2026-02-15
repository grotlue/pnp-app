#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function optionalEnv(name) {
  const value = process.env[name];
  if (!value) {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function normalizeAdminLocale(rawLocale) {
  if (!rawLocale) {
    return "en";
  }

  const normalized = rawLocale.trim().toLowerCase();
  if (normalized === "en" || normalized === "de") {
    return normalized;
  }

  console.warn(`Unsupported ADMIN_BOOTSTRAP_LOCALE "${rawLocale}". Falling back to "en".`);
  return "en";
}

async function listAllUsers(client) {
  const users = [];
  let page = 1;

  while (true) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) {
      throw new Error(`Failed to list users: ${error.message}`);
    }

    const chunk = data?.users ?? [];
    users.push(...chunk);

    if (!data?.nextPage) {
      break;
    }
    page = data.nextPage;
  }

  return users;
}

async function main() {
  const explicitSupabaseUrl = optionalEnv("NEXT_PUBLIC_SUPABASE_URL");
  const projectRef = optionalEnv("SUPABASE_PROJECT_REF");
  const supabaseUrl = explicitSupabaseUrl ?? (projectRef ? `https://${projectRef}.supabase.co` : null);

  if (!supabaseUrl) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_PROJECT_REF for admin bootstrap.",
    );
  }

  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const adminEmail = requireEnv("ADMIN_BOOTSTRAP_EMAIL").toLowerCase();
  const adminPassword = requireEnv("ADMIN_BOOTSTRAP_PASSWORD");
  const adminUsername = optionalEnv("ADMIN_BOOTSTRAP_USERNAME") ?? "admin";
  const adminDescription = optionalEnv("ADMIN_BOOTSTRAP_DESCRIPTION") ?? "System admin account";
  const adminLocale = normalizeAdminLocale(optionalEnv("ADMIN_BOOTSTRAP_LOCALE"));

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  const users = await listAllUsers(supabase);
  let adminUser = users.find((user) => user.email?.toLowerCase() === adminEmail);

  if (!adminUser) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        username: adminUsername,
      },
    });

    if (error || !data.user) {
      throw new Error(`Failed to create admin user: ${error?.message ?? "unknown error"}`);
    }

    adminUser = data.user;
    console.log(`Created admin user: ${adminEmail}`);
  } else {
    console.log(`Admin email already exists: ${adminEmail}`);
  }

  const { data: existingAdminProfile, error: adminProfileError } = await supabase
    .from("profiles")
    .select("id, username")
    .eq("role", "admin")
    .maybeSingle();

  if (adminProfileError) {
    throw new Error(`Failed to query existing admin profile: ${adminProfileError.message}`);
  }

  if (existingAdminProfile && existingAdminProfile.id !== adminUser.id) {
    throw new Error(
      `Another admin profile already exists (user id: ${existingAdminProfile.id}). Aborting bootstrap.`,
    );
  }

  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: adminUser.id,
      username: adminUsername,
      description: adminDescription,
      locale: adminLocale,
      role: "admin",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  if (profileError) {
    throw new Error(`Failed to upsert admin profile: ${profileError.message}`);
  }

  console.log(`Admin bootstrap completed for ${adminEmail}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
