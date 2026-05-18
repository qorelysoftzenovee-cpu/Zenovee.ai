"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function BillingActions() {
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const updateSubscription = async (action: "cancel" | "upgrade", planId?: string) => {
    setLoading(action + (planId ?? ""));
    setMessage(null);
    const response = await fetch("/api/billing/subscription", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, planId }),
    });
    const data = await response.json();
    setLoading(null);
    setMessage(response.ok ? data.message ?? "Subscription updated." : data.error ?? "Update failed.");
    if (response.ok) window.location.reload();
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
      <p className="text-xs text-muted-foreground">Secure payments via Razorpay. International cards are supported. Charges are processed in INR.</p>
      {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
    </div>
  );
}
