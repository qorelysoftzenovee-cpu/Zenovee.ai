"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Subscription = {
  plan_name: string;
  status: string;
} | null;

type BillingContextValue = {
  subscription: Subscription;
  isLoading: boolean;
  refresh: () => Promise<void>;
};

const BillingContext = createContext<BillingContextValue>({
  subscription: null,
  isLoading: true,
  refresh: async () => {},
});

export function BillingProvider({ children }: { children: ReactNode }) {
  const [subscription, setSubscription] = useState<Subscription>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadSubscription = async () => {
    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setSubscription(null);
        setIsLoading(false);
        return;
      }

      const { data } = await supabase
        .from("subscriptions")
        .select("plan_name,status")
        .eq("user_id", session.user.id)
        .maybeSingle<Subscription>();

      setSubscription(data ?? null);
    } catch {
      // Subscription load error; continue with null subscription
      setSubscription(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Defer subscription load so state updates don't run synchronously within the effect
    const t = setTimeout(() => {
      void loadSubscription();
    }, 0);

    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel("billing-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "subscriptions" }, () => {
        setTimeout(() => void loadSubscription(), 0);
      })
      .subscribe();

    return () => {
      clearTimeout(t);
      void supabase.removeChannel(channel);
    };
  }, []);

  return (
    <BillingContext.Provider value={{ subscription, isLoading, refresh: loadSubscription }}>
      {children}
    </BillingContext.Provider>
  );
}

export function useBillingSubscription() {
  return useContext(BillingContext);
}
