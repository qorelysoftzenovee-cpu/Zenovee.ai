"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { normalizeSubscriptionState, type RawSubscriptionLike } from "@/lib/billing/subscription-state";

type Subscription = ReturnType<typeof normalizeSubscriptionState> | null;

type BillingSubscriptionResponse = {
  billing?: {
    plan: string | null;
    subscriptionStatus: string | null;
    hasActiveSubscription: boolean;
  };
  subscription?: RawSubscriptionLike | null;
};

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

      const response = await fetch("/api/billing/subscription", { method: "GET", credentials: "include" });
      if (!response.ok) {
        setSubscription(null);
        return;
      }

      const payload = (await response.json()) as BillingSubscriptionResponse;
      if (payload.subscription) {
        setSubscription(normalizeSubscriptionState(payload.subscription));
        return;
      }

      if (payload.billing?.plan || payload.billing?.subscriptionStatus) {
        setSubscription(
          normalizeSubscriptionState({
            plan_id: payload.billing?.plan ?? null,
            plan_name: payload.billing?.plan ?? null,
            status: payload.billing?.subscriptionStatus ?? null,
          })
        );
        return;
      }

      setSubscription(null);
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
      .on("postgres_changes", { event: "*", schema: "public", table: "payments" }, () => {
        setTimeout(() => void loadSubscription(), 0);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "user_credits" }, () => {
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
