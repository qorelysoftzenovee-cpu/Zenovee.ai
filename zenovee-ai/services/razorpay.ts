import Razorpay from "razorpay";
import crypto from "crypto";
import { env, validateBillingEnv } from "@/lib/env";
import { getPlanById } from "@/app/subscription-plans";

export function getRazorpayClient() {
  validateBillingEnv();

  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay is not configured.");
  }

  return new Razorpay({
    key_id: env.RAZORPAY_KEY_ID,
    key_secret: env.RAZORPAY_KEY_SECRET,
  });
}

export function verifyCheckoutSignature(params: {
  razorpay_order_id?: string;
  razorpay_subscription_id?: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}) {
  const secret = env.RAZORPAY_KEY_SECRET?.trim();
  if (!secret) return false;

  const normalizedSignature = params.razorpay_signature.trim();

  const candidates: string[] = [];
  if (params.razorpay_order_id) {
    candidates.push(`${params.razorpay_order_id}|${params.razorpay_payment_id}`);
  }

  if (params.razorpay_subscription_id) {
    // Razorpay subscription checkout signatures are generated as:
    // razorpay_payment_id + "|" + razorpay_subscription_id
    candidates.push(`${params.razorpay_payment_id}|${params.razorpay_subscription_id}`);
  }

  return candidates.some((payload) => {
    const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
    return expected === normalizedSignature;
  });
}

export function verifyWebhookSignature(rawBody: string, signature: string | null) {
  const secret = env.RAZORPAY_WEBHOOK_SECRET?.trim();
  const normalizedSignature = signature?.trim();
  if (!normalizedSignature || !secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const expectedBuffer = Buffer.from(expected, "utf8");
  const signatureBuffer = Buffer.from(normalizedSignature, "utf8");

  if (expectedBuffer.length !== signatureBuffer.length) return false;

  return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
}

export async function createRazorpayPlanIfMissing(planId: string) {
  const plan = getPlanById(planId);
  if (!plan) throw new Error("Invalid plan");

  const razorpay = getRazorpayClient();
  const notes = { app_plan_id: plan.id, app_name: "zenovee" };

  const created = await razorpay.plans.create({
    period: "monthly",
    interval: 1,
    item: {
      name: `Zenovee ${plan.name}`,
      amount: plan.amountInPaise,
      currency: plan.currency,
      description: `${plan.credits} monthly credits`,
    },
    notes,
  });

  return created.id;
}
