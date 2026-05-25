"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Script from "next/script";

type RazorpayVerifyPayload = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayInstance = {
  open: () => void;
  on?: (event: "payment.failed", handler: (response: { error?: { description?: string; reason?: string; code?: string; source?: string } }) => void) => void;
};

type RazorpayOptions = {
  key: string;
  order_id?: string;
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

export function PricingActions({
  planId,
  planName,
}: {
  planId: string;
  planName: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusTone, setStatusTone] = useState<"default" | "success" | "error">("default");
  const [isScriptReady, setIsScriptReady] = useState<boolean | "checking">(() => {
    // On initial render, check if Razorpay is already loaded
    if (typeof window !== "undefined" && (window as any).Razorpay) {
      return true;
    }
    return "checking";
  });
  const requestCounterRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCheckoutTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  useEffect(() => {
    return () => clearCheckoutTimeout();
  }, []);

  useEffect(() => {
    // Verify script is ready and available
    const checkScriptReady = () => {
      if (typeof window !== "undefined" && (window as any).Razorpay) {
        setIsScriptReady(true);
      }
    };

    // Check immediately
    checkScriptReady();

    // Also check after a short delay for script loading
    if (isScriptReady === "checking") {
      const timer = setTimeout(checkScriptReady, 100);
      return () => clearTimeout(timer);
    }
  }, [isScriptReady]);

  const handleCheckout = async () => {
    if (loading) return;
    setLoading(true);
    setStatus(null);
    setStatusTone("default");
    
    // Verify Razorpay is available
    if (isScriptReady !== true || !window.Razorpay) {
      setStatusTone("error");
      setStatus("Payment system is initializing. Please try again in a moment.");
      setLoading(false);
      // Try to reload the script or force a check
      setIsScriptReady("checking");
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
        checkout?: { key?: string; orderId?: string };
      };

      if (!data?.checkout?.key || !data?.checkout?.orderId) {
        setStatusTone("error");
        setStatus("Checkout initialized with incomplete payload. Missing Razorpay key or order id.");
        setLoading(false);
        return;
      }

      const options = {
        key: data.checkout.key,
        order_id: data.checkout.orderId,
        name: "Zenovee AI",
        description: `${planName} Plan`,
        handler: async function (response: RazorpayVerifyPayload) {
          const verify = await fetch("/api/billing/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          });
          if (verify.ok) {
            clearCheckoutTimeout();
            setStatusTone("success");
            setStatus("Payment successful. Your subscription is active and your workspace is updating.");
            setLoading(false);
            router.push("/dashboard");
            router.refresh();
            return;
          }
          clearCheckoutTimeout();
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
            clearCheckoutTimeout();
            setStatus("Checkout cancelled.");
            setStatusTone("default");
            setLoading(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on?.("payment.failed", (payload) => {
        clearCheckoutTimeout();
        setStatusTone("error");
        setStatus(payload.error?.description ?? "Payment failed. Please try again.");
        setLoading(false);
      });

      clearCheckoutTimeout();
      timeoutRef.current = setTimeout(() => {
        setStatusTone("default");
        setStatus("Checkout cancelled.");
        setLoading(false);
      }, 8 * 60 * 1000);

      razorpay.open();
    } catch (error) {
      clearCheckoutTimeout();
      setStatusTone("error");
      setStatus(`Unable to start checkout. ${error instanceof Error ? error.message : "Unknown client error"}`);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" onLoad={() => setIsScriptReady(true)} onError={() => setIsScriptReady(false)} />
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
