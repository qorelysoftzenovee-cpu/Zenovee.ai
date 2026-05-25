"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type AuthContextValue = {
  session: Session | null;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextValue>({ session: null, isLoading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    const loadSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.warn("[AuthProvider] getSession error:", error);
        }
        const newSession = data.session ?? null;
        setSession(newSession);
        console.log("[AuthProvider] Loaded session:", newSession ? `User: ${newSession.user.email}` : "null");
      } catch (err) {
        console.error("[AuthProvider] loadSession exception:", err);
      } finally {
        setIsLoading(false);
      }
    };

    void loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      console.log("[AuthProvider] onAuthStateChange:", event, nextSession ? `User: ${nextSession.user.email}` : "null");
      setSession(nextSession ?? null);
      setIsLoading(false);
    });

    return () => {
      console.log("[AuthProvider] Cleaning up auth subscription");
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(() => ({ session, isLoading }), [session, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthSession() {
  return useContext(AuthContext);
}