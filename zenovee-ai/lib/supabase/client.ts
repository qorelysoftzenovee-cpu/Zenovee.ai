"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/types";
import { getPublicEnv, isSupabaseConfigured } from "@/lib/runtime";

type MinimalSupabaseLikeClient = {
  auth: {
    getSession: () => Promise<{ data: { session: null }; error: null }>;
    onAuthStateChange: (_cb: (_event: string, _session: null) => void) => { data: { subscription: { unsubscribe: () => void } } };
    signInWithPassword: () => Promise<{ data: { session: null }; error: Error }>;
    signOut: () => Promise<{ error: Error | null }>;
    resetPasswordForEmail: () => Promise<{ data: object; error: Error | null }>;
    updateUser: () => Promise<{ data: { user: null }; error: Error | null }>;
  };
  channel: (_name: string) => {
    on: () => ReturnType<MinimalSupabaseLikeClient["channel"]>;
    subscribe: () => { unsubscribe: () => void };
  };
  removeChannel: (_channel: unknown) => Promise<"ok">;
};

function createFallbackBrowserClient(): MinimalSupabaseLikeClient {
  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => undefined } } }),
      signInWithPassword: async () => ({ data: { session: null }, error: new Error("Authentication is temporarily unavailable.") }),
      signOut: async () => ({ error: null }),
      resetPasswordForEmail: async () => ({ data: {}, error: new Error("Password reset is temporarily unavailable.") }),
      updateUser: async () => ({ data: { user: null }, error: new Error("Password update is temporarily unavailable.") }),
    },
    channel: () => {
      const chain = {
        on: () => chain,
        subscribe: () => ({ unsubscribe: () => undefined }),
      };
      return chain;
    },
    removeChannel: async () => "ok",
  };
}

export function createSupabaseBrowserClient() {
  if (!isSupabaseConfigured()) {
    return createFallbackBrowserClient() as unknown as ReturnType<typeof createBrowserClient<Database>>;
  }

  const { supabaseUrl, supabaseAnonKey } = getPublicEnv();
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
