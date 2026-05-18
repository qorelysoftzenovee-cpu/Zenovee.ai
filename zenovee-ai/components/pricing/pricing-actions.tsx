"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import Script from "next/script";

type RazorpayVerifyPayload = {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_order_id?: string;
  razorpay_signature: string;
};

type RazorpayInstance = {
  open: () => void;
};

type RazorpayOptions = {
  key: string;
  order_id?: string;
  subscription_id: string;
  name: string;
  description: string;
  handler: (response: RazorpayVerifyPayload) => Promise<void>;
  prefill: {
    name: string;
    email: string;
  };
  theme: {
    color: string;
  };
  modal: {
    ondismiss: () => void;
  };
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

export function PricingActions({ planId, planName }: { planId: string; planName: string }) {
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    setStatus(null);

    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus(data.error ?? "Checkout failed");
        setLoading(false);
        return;
      }

      // Initialize Razorpay checkout
      const options = {
        key: data.razorpayKey,
        subscription_id: data.subscription.id,
        name: "Zenovee AI",
        description: `${planName} Plan Subscription`,
        handler: async function (response: RazorpayVerifyPayload) {
          const verify = await fetch("/api/billing/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          });
          if (verify.ok) {
            setStatus("Payment successful. Subscription activated.");
            window.location.href = "/dashboard";
            return;
          }
          setStatus("Payment captured but verification failed. Contact support.");
          setLoading(false);
        },
        prefill: {
          name: "",
          email: "",
        },
        theme: {
          color: "#6366f1",
        },
        modal: {
          ondismiss: function () {
            setStatus(null);
            setLoading(false);
          },
        },
      };

      if (window.Razorpay) {
        const razorpay = new window.Razorpay(options);
        razorpay.open();
      } else {
        setStatus("Payments are not configured yet.");
        setLoading(false);
      }
    } catch {
      setStatus("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      <Button className="w-full min-h-11" onClick={handleCheckout} disabled={loading} aria-label={`Checkout ${planName} plan`}>
        {loading ? "Preparing..." : `Choose ${planName}`}
      </Button>
      <p className="text-xs text-muted-foreground">International cards are supported. Charges are processed securely in INR.</p>
      {status ? <p className="text-xs text-muted-foreground">{status}</p> : null}
    </div>
  );
}

export function TopupActions({ topupId, label }: { topupId: string; label: string }) {
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleTopupCheckout = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topupId }),
      });

      const data = await response.json();
      if (!response.ok) {
        setStatus(data.error ?? "Topup checkout failed");
        setLoading(false);
        return;
      }

      const options = {
        key: data.razorpayKey,
        order_id: data.order.id,
        name: "Zenovee AI",
        description: `${label} Credit Topup`,
        handler: async function (payload: RazorpayVerifyPayload) {
          const verify = await fetch("/api/billing/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (verify.ok) {
            setStatus("Topup successful. Credits added.");
            window.location.href = "/dashboard/tools";
            return;
          }
          setStatus("Payment captured but topup verification failed.");
          setLoading(false);
        },
        prefill: { name: "", email: "" },
        theme: { color: "#6366f1" },
        modal: {
          ondismiss: function () {
            setStatus(null);
            setLoading(false);
          },
        },
      };

      if (window.Razorpay) {
        const razorpay = new window.Razorpay(options as unknown as RazorpayOptions);
        razorpay.open();
      } else {
        setStatus("Payments are not configured yet.");
        setLoading(false);
      }
    } catch {
      setStatus("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      <Button className="w-full min-h-11" onClick={handleTopupCheckout} disabled={loading} aria-label={`Buy ${label} topup`}>
        {loading ? "Preparing..." : `Buy ${label}`}
      </Button>
      <p className="text-xs text-muted-foreground">Secure payments via Razorpay over SSL. Charged in INR.</p>
      {status ? <p className="text-xs text-muted-foreground">{status}</p> : null}
    </div>
  );
}