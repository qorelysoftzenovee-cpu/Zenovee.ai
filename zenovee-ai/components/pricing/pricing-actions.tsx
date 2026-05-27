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
  amount?: number;
  currency?: string;
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

type ApiErrorPayload = {
  error?: string;
  reason?: string;
  source?: string;
  code?: string;
  retryable?: boolean;
  retryAfterSeconds?: number;
};

type CheckoutResponse = {
  checkout?: {
    key?: string;
    orderId?: string;
    amountPaise?: number;
    currency?: string;
    resumed?: boolean;
    plan?: {
      id?: string;
      name?: string;
    };
  };
};

async function resolveCheckoutError(response: Response, fallback: string) {
  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    // Non-JSON response; handled by fallback below.
  }

  const data = payload as ApiErrorPayload | null;
  const details = [data?.error, data?.reason, data?.source ? `source: ${data.source}` : null].filter(Boolean).join(" • ");
  const retryHint = data?.retryAfterSeconds ? ` Retry in ${data.retryAfterSeconds}s.` : data?.retryable ? " Please retry." : "";
  return details ? `${details}${retryHint}` : `${fallback} (HTTP ${response.status})`;
}

async function reportCheckoutState(orderId: string | undefined, state: "cancelled" | "failed" | "abandoned", reason: string) {
  if (!orderId) return;

  try {
    await fetch("/api/billing/checkout-state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, state, reason }),
      keepalive: true,
    });
  } catch {
    // Best-effort cleanup only.
  }
}

export function PricingActions({
  planId,
  planName,
}: {
  planId: string;
  planName: string;
}) {
  const router = useRouter();
  const normalizedPlanId = planId.trim().toLowerCase();
  const isScalePlan = normalizedPlanId === "scale";
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusTone, setStatusTone] = useState<"default" | "success" | "error">("default");
  const [isScriptReady, setIsScriptReady] = useState<boolean | "checking">(() => {
    // On initial render, check if Razorpay is already loaded
    if (typeof window !== "undefined" && window.Razorpay) {
      return true;
    }
    return "checking";
  });
  const requestCounterRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeOrderIdRef = useRef<string | null>(null);

  const clearCheckoutTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const logScaleDiagnostics = (stage: string, metadata?: Record<string, unknown>) => {
    if (!isScalePlan) return;

    console.info("[billing][scale]", {
      stage,
      planId,
      planName,
      isScriptReady,
      hasRazorpayGlobal: typeof window !== "undefined" && Boolean(window.Razorpay),
      ...metadata,
    });
  };

  useEffect(() => {
    return () => clearCheckoutTimeout();
  }, []);

  useEffect(() => {
    // Verify script is ready and available
    const checkScriptReady = () => {
      if (typeof window !== "undefined" && window.Razorpay) {
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

    const razorpayConstructor = typeof window !== "undefined" ? window.Razorpay : undefined;
    logScaleDiagnostics("checkout_click", { loading, normalizedPlanId });
    
    // Verify Razorpay is available
    if (!razorpayConstructor) {
      logScaleDiagnostics("razorpay_not_ready");
      setStatusTone("error");
      setStatus("Secure checkout is getting ready. Please wait a few seconds and try again.");
      setLoading(false);
      // Try to reload the script or force a check
      setIsScriptReady("checking");
      return;
    }

    if (isScriptReady !== true) {
      setIsScriptReady(true);
    }

    try {
      requestCounterRef.current += 1;
      const requestKey = `plan:${planId}:${requestCounterRef.current}`;
      logScaleDiagnostics("checkout_request_started", { requestKey });
      let response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-idempotency-key": requestKey },
        body: JSON.stringify({ planId }),
      });

      if (!response.ok && response.status >= 500) {
        await new Promise((resolve) => setTimeout(resolve, 700));
        response = await fetch("/api/billing/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-idempotency-key": `${requestKey}:retry` },
          body: JSON.stringify({ planId }),
        });
      }

      if (!response.ok) {
        setStatusTone("error");
        setStatus(await resolveCheckoutError(response, "Checkout initialization failed"));
        setLoading(false);
        return;
      }

      const data = (await response.json()) as CheckoutResponse;
      logScaleDiagnostics("checkout_response_received", { checkout: data?.checkout ?? null });

      if (!data?.checkout?.key || !data?.checkout?.orderId || !data?.checkout?.amountPaise || !data?.checkout?.currency) {
        logScaleDiagnostics("checkout_response_incomplete", { checkout: data?.checkout ?? null });
        setStatusTone("error");
        setStatus("We couldn’t prepare the full secure payment session. Please retry once from billing.");
        setLoading(false);
        return;
      }

      activeOrderIdRef.current = data.checkout.orderId;

      const options = {
        key: data.checkout.key,
        amount: data.checkout.amountPaise,
        currency: data.checkout.currency,
        order_id: data.checkout.orderId,
        name: "Zenovee",
        description: `${planName} monthly workspace plan`,
        handler: async function (response: RazorpayVerifyPayload) {
          const verify = await fetch("/api/billing/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          });
          if (verify.ok) {
            clearCheckoutTimeout();
            activeOrderIdRef.current = null;
            setStatusTone("success");
            setStatus("Payment received securely. Your Zenovee subscription is being activated now.");
            setLoading(false);
            router.push("/dashboard");
            router.refresh();
            return;
          }
          clearCheckoutTimeout();
          await reportCheckoutState(activeOrderIdRef.current ?? data.checkout?.orderId, "failed", "VERIFICATION_FAILED");
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
          ondismiss: async function () {
            clearCheckoutTimeout();
            await reportCheckoutState(activeOrderIdRef.current ?? data.checkout?.orderId, "cancelled", "CHECKOUT_DISMISSED");
            activeOrderIdRef.current = null;
            setStatus("Checkout was closed before payment completed. No charge was completed, and you can safely try again.");
            setStatusTone("default");
            setLoading(false);
          },
        },
      };

      logScaleDiagnostics("razorpay_opening", {
        orderId: data.checkout.orderId,
        amountPaise: data.checkout.amountPaise,
        currency: data.checkout.currency,
      });

      const razorpay = new razorpayConstructor(options);
      razorpay.on?.("payment.failed", async (payload) => {
        clearCheckoutTimeout();
        await reportCheckoutState(activeOrderIdRef.current ?? data.checkout?.orderId, "failed", payload.error?.code ?? payload.error?.reason ?? "PAYMENT_FAILED");
        activeOrderIdRef.current = null;
        setStatusTone("error");
        setStatus(payload.error?.description ?? "Payment was not completed. Please verify your bank or UPI details and try again.");
        setLoading(false);
      });

      clearCheckoutTimeout();
      timeoutRef.current = setTimeout(() => {
        void reportCheckoutState(activeOrderIdRef.current ?? data.checkout?.orderId, "abandoned", "CHECKOUT_TIMEOUT");
        activeOrderIdRef.current = null;
        setStatusTone("default");
        setStatus("Your protected checkout session timed out. Please start again whenever you’re ready.");
        setLoading(false);
      }, 8 * 60 * 1000);

      razorpay.open();
    } catch (error) {
      logScaleDiagnostics("checkout_exception", { error: error instanceof Error ? error.message : String(error) });
      clearCheckoutTimeout();
      await reportCheckoutState(activeOrderIdRef.current ?? undefined, "failed", "CLIENT_CHECKOUT_EXCEPTION");
      activeOrderIdRef.current = null;
      setStatusTone("error");
      setStatus(`We couldn’t open secure checkout. ${error instanceof Error ? error.message : "Please refresh and try again."}`);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" onLoad={() => setIsScriptReady(true)} onError={() => setIsScriptReady(false)} />
      <Button className="w-full min-h-11" onClick={handleCheckout} disabled={loading} aria-label={`Checkout ${planName} plan`}>
        {loading ? "Preparing secure checkout..." : `Continue with ${planName}`}
      </Button>
      <p className="text-xs text-muted-foreground">Protected monthly billing for Zenovee plans. Subscription access updates automatically after successful verification.</p>
      {status ? (
        <p className={`text-xs ${statusTone === "error" ? "text-rose-500" : statusTone === "success" ? "text-emerald-600 dark:text-emerald-300" : "text-muted-foreground"}`}>
          {status}
        </p>
      ) : null}
    </div>
  );
}
