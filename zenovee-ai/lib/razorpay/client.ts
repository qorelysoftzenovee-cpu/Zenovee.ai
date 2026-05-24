import Razorpay from "razorpay";
import crypto from "crypto";
import { env, validateBillingEnv } from "@/lib/env";
import { getPlanById } from "@/lib/billing/plans";

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
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}) {
  const secret = env.RAZORPAY_KEY_SECRET?.trim();
  if (!secret) return false;

  const payload = `${params.razorpay_order_id}|${params.razorpay_payment_id}`;
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return expected === params.razorpay_signature.trim();
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

export async function createRazorpayPlanForAppPlan(planId: string) {
  const plan = getPlanById(planId);
  if (!plan) throw new Error("Invalid plan");

  const razorpay = getRazorpayClient();
  const created = await razorpay.plans.create({
    period: "monthly",
    interval: 1,
    item: {
      name: `Zenovee ${plan.name}`,
      amount: plan.amountPaise,
      currency: "INR",
      description: `${plan.credits} monthly credits`,
    },
    notes: { app_plan_id: plan.id, app_name: "zenovee" },
  });

  return created.id;
}