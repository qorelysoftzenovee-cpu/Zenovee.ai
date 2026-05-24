import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const checkoutStateSchema = z
  .object({
    subscriptionId: z.string().min(1).optional(),
    orderId: z.string().min(1).optional(),
    state: z.enum(["cancelled", "failed", "abandoned"]),
    reason: z.string().min(1).optional(),
  })
  .refine((value) => Boolean(value.subscriptionId || value.orderId), {
    message: "subscriptionId or orderId is required",
  });

function resolveStatus(state: "cancelled" | "failed" | "abandoned") {
  if (state === "failed") return "FAILED" as const;
  return "CANCELLED" as const;
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = checkoutStateSchema.parse(await request.json());
    const supabaseAdmin = getSupabaseAdmin();
    const nextStatus = resolveStatus(body.state);
    const nowIso = new Date().toISOString();

    let query = supabaseAdmin
      .from("payments")
      .update({
        status: nextStatus,
        failure_reason: body.reason ?? (nextStatus === "FAILED" ? "PAYMENT_FAILED" : "CHECKOUT_CANCELLED"),
        updated_at: nowIso,
      } as never)
      .eq("user_id", user.id)
      .eq("status", "PENDING");

    if (body.subscriptionId) {
      query = query.eq("subscription_id", body.subscriptionId);
    }

    if (body.orderId) {
      query = query.eq("order_id", body.orderId);
    }

    const { error } = await query;
    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ success: true, status: nextStatus });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid payload" }, { status: 400 });
    }

    return NextResponse.json({ error: "Unable to update checkout state" }, { status: 500 });
  }
}
