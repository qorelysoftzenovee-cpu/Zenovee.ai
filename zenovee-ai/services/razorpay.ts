import Razorpay from "razorpay";
import crypto from "crypto";
import { env, validateProductionEnv } from "@/lib/env";
import { getPlanById } from "@/app/subscription-plans";

export function getRazorpayClient() {
  validateProductionEnv();

  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay is not configured.");
  }

  return new Razorpay({
    key_id: env.RAZORPAY_KEY_ID,
    key_secret: env.RAZORPAY_KEY_SECRET,
  });
}

export function verifyCheckoutSignature(params: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}) {
  if (!env.RAZORPAY_KEY_SECRET) return false;
  const body = `${params.razorpay_order_id}|${params.razorpay_payment_id}`;
  const expected = crypto.createHmac("sha256", env.RAZORPAY_KEY_SECRET).update(body).digest("hex");
  return expected === params.razorpay_signature;
}

export function verifyWebhookSignature(rawBody: string, signature: string | null) {
  if (!signature || !env.RAZORPAY_WEBHOOK_SECRET) return false;
  const expected = crypto.createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET).update(rawBody).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
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
