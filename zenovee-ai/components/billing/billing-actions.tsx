"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function BillingActions() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const updateSubscription = async (action: "cancel" | "upgrade", planId?: string) => {
    if (loading) return;
    setLoading(action + (planId ?? ""));
    setMessage(null);
    try {
      const response = await fetch("/api/billing/subscription", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, planId }),
      });
      const data = await response.json();
      setMessage(response.ok ? data.message ?? "Subscription updated." : data.error ?? "Unable to update your subscription right now.");
      if (response.ok) {
        router.refresh();
      }
    } catch {
      setMessage("Unable to update your subscription right now. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => updateSubscription("upgrade", "growth")} disabled={Boolean(loading)}>
          Upgrade to Growth
        </Button>
        <Button size="sm" variant="outline" onClick={() => updateSubscription("upgrade", "scale")} disabled={Boolean(loading)}>
          Upgrade to Scale
        </Button>
        <Button size="sm" variant="ghost" onClick={() => updateSubscription("cancel")} disabled={Boolean(loading)}>
          Cancel Subscription
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">Secure payments via Razorpay. Charges are processed in INR.</p>
      {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
    </div>
  );
}
