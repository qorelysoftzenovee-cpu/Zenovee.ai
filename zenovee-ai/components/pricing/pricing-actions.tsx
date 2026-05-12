"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function PricingActions({ planId, planName }: { planId: string; planName: string }) {
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    setStatus(null);

    const response = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId }),
    });

    const data = await response.json();
    setLoading(false);
    setStatus(data.message ?? data.error ?? "Unknown billing response.");
  };

  return (
    <div className="space-y-2">
      <Button className="w-full" onClick={handleCheckout} disabled={loading}>
        {loading ? "Preparing..." : `Choose ${planName}`}
      </Button>
      {status ? <p className="text-xs text-muted-foreground">{status}</p> : null}
    </div>
  );
}