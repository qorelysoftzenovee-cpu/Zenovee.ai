import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { getPublicEnv, getServerEnv, isSupabaseAdminConfigured, missingConfigMessage } from "@/lib/runtime";

export function getSupabaseAdmin() {
  if (!isSupabaseAdminConfigured()) {
    throw new Error(missingConfigMessage("Supabase admin"));
  }

  const { supabaseUrl } = getPublicEnv();
  const { supabaseServiceRoleKey } = getServerEnv();

  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// Backward-compatible lazy client for existing imports.
// Accessing any property initializes the client at runtime.
export const supabaseAdmin = new Proxy({} as ReturnType<typeof createClient<Database>>, {
  get(_target, prop, receiver) {
    const client = getSupabaseAdmin() as unknown as Record<PropertyKey, unknown>;
    const value = Reflect.get(client, prop, receiver);

    return typeof value === "function" ? (value as (...args: unknown[]) => unknown).bind(client) : value;
  },
});
