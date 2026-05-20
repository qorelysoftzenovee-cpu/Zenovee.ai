"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusTone, setStatusTone] = useState<"default" | "success" | "error">("default");

  const handleCheckout = async () => {
    if (loading) return;
    setLoading(true);
    setStatus(null);
    setStatusTone("default");

    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });

      const data = await response.json();

      if (!response.ok) {
        setStatusTone("error");
        setStatus(data.error ?? "We couldn't start checkout right now.");
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
            setStatusTone("success");
            setStatus("Payment successful. Your subscription is active and your workspace is updating.");
            setLoading(false);
            router.push("/dashboard");
            router.refresh();
            return;
          }
          setStatusTone("error");
          setStatus("Payment was received, but your subscription is still syncing. Please contact support if it does not update shortly.");
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
            setStatus("Checkout closed. You can resume whenever you're ready.");
            setStatusTone("default");
            setLoading(false);
          },
        },
      };

      if (window.Razorpay) {
        const razorpay = new window.Razorpay(options);
        razorpay.open();
      } else {
        setStatusTone("error");
        setStatus("Payments are temporarily unavailable.");
        setLoading(false);
      }
    } catch {
      setStatusTone("error");
      setStatus("Unable to start checkout right now. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      <Button className="w-full min-h-11" onClick={handleCheckout} disabled={loading} aria-label={`Checkout ${planName} plan`}>
        {loading ? "Preparing..." : `Choose ${planName}`}
      </Button>
      <p className="text-xs text-muted-foreground">Secure payments via Razorpay. Your subscription updates automatically after payment.</p>
      {status ? (
        <p className={`text-xs ${statusTone === "error" ? "text-rose-500" : statusTone === "success" ? "text-emerald-600 dark:text-emerald-300" : "text-muted-foreground"}`}>
          {status}
        </p>
      ) : null}
    </div>
  );
}

export function TopupActions({ topupId, label }: { topupId: string; label: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusTone, setStatusTone] = useState<"default" | "success" | "error">("default");

  const handleTopupCheckout = async () => {
    if (loading) return;
    setLoading(true);
    setStatus(null);
    setStatusTone("default");
    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topupId }),
      });

      const data = await response.json();
      if (!response.ok) {
        setStatusTone("error");
        setStatus(data.error ?? "We couldn't start checkout right now.");
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
            setStatusTone("success");
            setStatus("Top-up successful. Your credits have been added and your workspace is updating.");
            setLoading(false);
            router.push("/dashboard/tools");
            router.refresh();
            return;
          }
          setStatusTone("error");
          setStatus("Payment was received, but your credits are still syncing. Please contact support if they do not update shortly.");
          setLoading(false);
        },
        prefill: { name: "", email: "" },
        theme: { color: "#6366f1" },
        modal: {
          ondismiss: function () {
            setStatus("Checkout closed. You can resume whenever you're ready.");
            setStatusTone("default");
            setLoading(false);
          },
        },
      };

      if (window.Razorpay) {
        const razorpay = new window.Razorpay(options as unknown as RazorpayOptions);
        razorpay.open();
      } else {
        setStatusTone("error");
        setStatus("Payments are temporarily unavailable.");
        setLoading(false);
      }
    } catch {
      setStatusTone("error");
      setStatus("Unable to start checkout right now. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      <Button className="w-full min-h-11" onClick={handleTopupCheckout} disabled={loading} aria-label={`Buy ${label} topup`}>
        {loading ? "Preparing..." : `Buy ${label}`}
      </Button>
      <p className="text-xs text-muted-foreground">Secure payments via Razorpay. Your credits update automatically after payment.</p>
      {status ? (
        <p className={`text-xs ${statusTone === "error" ? "text-rose-500" : statusTone === "success" ? "text-emerald-600 dark:text-emerald-300" : "text-muted-foreground"}`}>
          {status}
        </p>
      ) : null}
    </div>
  );
}