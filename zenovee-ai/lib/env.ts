import { z } from "zod";

const envSchema = z.object({
  // Public
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_APP_NAME: z.string().min(1),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_RAZORPAY_KEY_ID: z.string().min(1),

  // Private
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  GROQ_API_KEY: z.string().min(1),
  RAZORPAY_KEY_ID: z.string().min(1),
  RAZORPAY_KEY_SECRET: z.string().min(1),
  RAZORPAY_WEBHOOK_SECRET: z.string().min(1),
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(1),
  ADMIN_EMAIL: z.string().email().optional(),

  // Optional / future email support
  RESEND_API_KEY: z.string().optional(),
  SUPPORT_EMAIL: z.string().email().optional(),
});

const parsedEnv = envSchema.safeParse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_RAZORPAY_KEY_ID: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  GROQ_API_KEY: process.env.GROQ_API_KEY,
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  SUPPORT_EMAIL: process.env.SUPPORT_EMAIL,
});

export const safeEnv = parsedEnv.success
  ? parsedEnv.data
  : {
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "",
      NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME ?? "",
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
      NEXT_PUBLIC_RAZORPAY_KEY_ID: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "",
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
      GROQ_API_KEY: process.env.GROQ_API_KEY ?? "",
      RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID ?? "",
      RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET ?? "",
      RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET ?? "",
      NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? "",
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ?? "",
      ADMIN_EMAIL: process.env.ADMIN_EMAIL,
      RESEND_API_KEY: process.env.RESEND_API_KEY,
      SUPPORT_EMAIL: process.env.SUPPORT_EMAIL,
    };

export const env = safeEnv;

const billingEnvSchema = envSchema.pick({
  NEXT_PUBLIC_APP_URL: true,
  NEXT_PUBLIC_APP_NAME: true,
  NEXT_PUBLIC_SUPABASE_URL: true,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: true,
  NEXT_PUBLIC_RAZORPAY_KEY_ID: true,
  SUPABASE_SERVICE_ROLE_KEY: true,
  RAZORPAY_KEY_ID: true,
  RAZORPAY_KEY_SECRET: true,
  RAZORPAY_WEBHOOK_SECRET: true,
});

const aiEnvSchema = envSchema.pick({
  GROQ_API_KEY: true,
});

export function validateProductionEnv() {
  const result = envSchema.safeParse(env);

  if (!result.success) {
    const message = result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
    throw new Error(`Invalid environment configuration: ${message}`);
  }

  return result.data;
}

export function validateBillingEnv() {
  const result = billingEnvSchema.safeParse(env);

  if (!result.success) {
    const message = result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
    throw new Error(`Invalid billing environment configuration: ${message}`);
  }

  return result.data;
}

export function validateAiEnv() {
  const result = aiEnvSchema.safeParse(env);

  if (!result.success) {
    const message = result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
    throw new Error(`Invalid AI environment configuration: ${message}`);
  }

  return result.data;
}
