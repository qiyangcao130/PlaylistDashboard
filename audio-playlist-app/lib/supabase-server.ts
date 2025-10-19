import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY, SUPABASE_URL } from "./env";
import type { Database } from "./database.types";

const ACCESS_TOKEN_COOKIE = "sb-access-token";

/**
 * Creates a Supabase client with the user's authentication token
 * This enforces Row Level Security (RLS) policies
 */
export function createSupabaseServerClient(): SupabaseClient<Database, "public"> {
  const cookieStore = cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;

  return createClient<Database, "public">(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      detectSessionInUrl: false
    },
    global: {
      headers: accessToken ? {
        Authorization: `Bearer ${accessToken}`
      } : {}
    }
  });
}

/**
 * Creates a Supabase client with service role privileges
 * WARNING: Bypasses Row Level Security - use with caution
 */
export function createSupabaseAdminClient(): SupabaseClient<Database, "public"> {
  return createClient<Database, "public">(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      detectSessionInUrl: false,
      autoRefreshToken: false
    }
  });
}
