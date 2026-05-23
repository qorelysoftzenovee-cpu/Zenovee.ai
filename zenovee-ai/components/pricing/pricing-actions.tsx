"use client";

import { useRef, useState } from "react";
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

async function resolveCheckoutError(response: Response, fallback: string) {
  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    // Non-JSON response; handled by fallback below.
  }

  const data = payload as { error?: string; reason?: string; source?: string } | null;
  const details = [data?.error, data?.reason, data?.source ? `source: ${data.source}` : null].filter(Boolean).join(" • ");
  return details || `${fallback} (HTTP ${response.status})`;
}

export function PricingActions({ planId, planName }: { planId: string; planName: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusTone, setStatusTone] = useState<"default" | "success" | "error">("default");
  const [isScriptReady, setIsScriptReady] = useState(false);
  const requestCounterRef = useRef(0);

  const handleCheckout = async () => {
    if (loading) return;
    setLoading(true);
    setStatus(null);
    setStatusTone("default");
    if (!isScriptReady || !window.Razorpay) {
      setStatusTone("error");
      setStatus("Payments are still initializing. Please try again in a moment.");
      setLoading(false);
      return;
    }

    try {
      requestCounterRef.current += 1;
      const requestKey = `plan:${planId}:${requestCounterRef.current}`;
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-idempotency-key": requestKey },
        body: JSON.stringify({ planId }),
      });

      if (!response.ok) {
        setStatusTone("error");
        setStatus(await resolveCheckoutError(response, "Checkout initialization failed"));
        setLoading(false);
        return;
      }

      const data = (await response.json()) as {
        razorpayKey?: string;
        subscription?: { id?: string };
      };

      if (!data?.razorpayKey || !data?.subscription?.id) {
        setStatusTone("error");
        setStatus("Checkout initialized with incomplete payload. Missing Razorpay key or subscription id.");
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
          setStatus(await resolveCheckoutError(verify, "Payment captured but verification failed"));
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

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      setStatusTone("error");
      setStatus(`Unable to start checkout. ${error instanceof Error ? error.message : "Unknown client error"}`);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" onLoad={() => setIsScriptReady(true)} />
      <Button className="w-full min-h-11" onClick={handleCheckout} disabled={loading || !isScriptReady} aria-label={`Checkout ${planName} plan`}>
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
  const [isScriptReady, setIsScriptReady] = useState(false);
  const requestCounterRef = useRef(0);

  const handleTopupCheckout = async () => {
    if (loading) return;
    setLoading(true);
    setStatus(null);
    setStatusTone("default");
    if (!isScriptReady || !window.Razorpay) {
      setStatusTone("error");
      setStatus("Payments are still initializing. Please try again in a moment.");
      setLoading(false);
      return;
    }
    try {
      requestCounterRef.current += 1;
      const requestKey = `topup:${topupId}:${requestCounterRef.current}`;
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-idempotency-key": requestKey },
        body: JSON.stringify({ topupId }),
      });

      if (!response.ok) {
        setStatusTone("error");
        setStatus(await resolveCheckoutError(response, "Top-up checkout initialization failed"));
        setLoading(false);
        return;
      }

      const data = (await response.json()) as {
        razorpayKey?: string;
        order?: { id?: string };
      };

      if (!data?.razorpayKey || !data?.order?.id) {
        setStatusTone("error");
        setStatus("Top-up checkout initialized with incomplete payload. Missing Razorpay key or order id.");
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
          setStatus(await resolveCheckoutError(verify, "Payment captured but top-up verification failed"));
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

      const razorpay = new window.Razorpay(options as unknown as RazorpayOptions);
      razorpay.open();
    } catch (error) {
      setStatusTone("error");
      setStatus(`Unable to start top-up checkout. ${error instanceof Error ? error.message : "Unknown client error"}`);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" onLoad={() => setIsScriptReady(true)} />
      <Button className="w-full min-h-11" onClick={handleTopupCheckout} disabled={loading || !isScriptReady} aria-label={`Buy ${label} topup`}>
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