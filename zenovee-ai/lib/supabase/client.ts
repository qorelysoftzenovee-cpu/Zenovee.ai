"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/types";
import { getPublicEnv, isSupabaseConfigured } from "@/lib/runtime";

type MinimalSupabaseLikeClient = {
  auth: {
    getSession: () => Promise<{ data: { session: null }; error: null }>;
    onAuthStateChange: (_cb: (_event: string, _session: null) => void) => { data: { subscription: { unsubscribe: () => void } } };
    signInWithPassword: () => Promise<{ data: { session: null }; error: Error }>;
  };
};

function createFallbackBrowserClient(): MinimalSupabaseLikeClient {
  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => undefined } } }),
      signInWithPassword: async () => ({ data: { session: null }, error: new Error("Authentication is temporarily unavailable.") }),
    },
  };
}

export function createSupabaseBrowserClient() {
  if (!isSupabaseConfigured()) {
    return createFallbackBrowserClient() as unknown as ReturnType<typeof createBrowserClient<Database>>;
  }

  const { supabaseUrl, supabaseAnonKey } = getPublicEnv();
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
