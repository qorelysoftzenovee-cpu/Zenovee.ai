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
        console.log("[BillingProvider] No session, clearing subscription");
        setSubscription(null);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("subscriptions")
        .select("plan_name,status")
        .eq("user_id", session.user.id)
        .maybeSingle<Subscription>();

      if (error) {
        console.warn("[BillingProvider] Subscription fetch error:", error);
        setSubscription(null);
      } else {
        console.log("[BillingProvider] Loaded subscription:", data ? `Plan: ${data.plan_name}, Status: ${data.status}` : "null");
        setSubscription(data);
      }
    } catch (err) {
      console.error("[BillingProvider] loadSubscription exception:", err);
      setSubscription(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadSubscription();

    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel("billing-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "subscriptions" }, () => {
        console.log("[BillingProvider] Subscription changed, refreshing...");
        void loadSubscription();
      })
      .subscribe();

    return () => {
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
