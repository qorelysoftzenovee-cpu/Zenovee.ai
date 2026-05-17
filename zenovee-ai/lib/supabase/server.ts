import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/types";
import { getPublicEnv, isSupabaseConfigured } from "@/lib/runtime";

type MinimalServerSupabaseLikeClient = {
  auth: {
    getUser: () => Promise<{ data: { user: null }; error: null }>;
  };
  from: () => {
    select: () => {
      eq: () => {
        maybeSingle: () => Promise<{ data: null; error: null }>;
      };
    };
  };
};

function createFallbackServerClient(): MinimalServerSupabaseLikeClient {
  return {
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: null, error: null }),
        }),
      }),
    }),
  };
}

export async function createSupabaseServerClient() {
  if (!isSupabaseConfigured()) {
    return createFallbackServerClient() as unknown as ReturnType<typeof createServerClient<Database>>;
  }

  const { supabaseUrl, supabaseAnonKey } = getPublicEnv();
  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
      },
    },
  });
}
