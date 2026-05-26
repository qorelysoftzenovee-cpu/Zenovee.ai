"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function BillingActions() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"default" | "success" | "error">("default");

  const updateSubscription = async (action: "cancel" | "upgrade", planId?: string) => {
    if (loading) return;
    setLoading(action + (planId ?? ""));
    setMessage(null);
    setMessageTone("default");
    try {
      const response = await fetch("/api/billing/subscription", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, planId }),
      });
      const data = await response.json();
      setMessage(response.ok ? data.message ?? "Subscription updated successfully." : data.error ?? "Unable to update your subscription right now.");
      setMessageTone(response.ok ? "success" : "error");
      if (response.ok) {
        router.refresh();
      }
    } catch {
      setMessageTone("error");
      setMessage("Unable to update your subscription right now. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => updateSubscription("upgrade", "growth")} disabled={Boolean(loading)}>
          Move to Growth
        </Button>
        <Button size="sm" variant="outline" onClick={() => updateSubscription("upgrade", "scale")} disabled={Boolean(loading)}>
          Move to Scale
        </Button>
        <Button size="sm" variant="ghost" onClick={() => updateSubscription("cancel")} disabled={Boolean(loading)}>
          Cancel at period end
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">Secure Razorpay billing with protected verification. Your Zenovee subscription updates automatically after successful payment confirmation.</p>
      {message ? (
        <p className={`text-xs ${messageTone === "error" ? "text-rose-500" : messageTone === "success" ? "text-emerald-600 dark:text-emerald-300" : "text-muted-foreground"}`}>
          {message}
        </p>
      ) : null}
    </div>
  );
}
