import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyWebhookSignature } from "@/lib/razorpay/client";
import { BillingSyncService } from "@/lib/billing/sync-service";
import { serverLog } from "@/lib/logger";

const payloadSchema: z.ZodType<Record<string, unknown>> = z.record(z.string(), z.unknown());

const webhookSchema = z.object({
  event: z.string().min(1),
  account_id: z.string().optional(),
  created_at: z.number().int().optional(),
  payload: payloadSchema,
});

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature");
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("application/json")) {
      return NextResponse.json({ success: false, error: "Invalid content type" }, { status: 415 });
    }

    const verified = verifyWebhookSignature(rawBody, signature);
    if (!verified) {
      serverLog({
        level: "warn",
        route: "api/webhooks/razorpay",
        message: "Webhook signature verification failed",
        metadata: { verification: "failed" },
      });
      return NextResponse.json({ success: false, error: "Invalid webhook signature" }, { status: 401 });
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ success: false, error: "Malformed JSON payload" }, { status: 400 });
    }

    const parsed = webhookSchema.safeParse(parsedJson);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Malformed webhook payload" }, { status: 400 });
    }

    const sync = await new BillingSyncService().process(parsed.data);
    serverLog({
      level: "info",
      route: "api/webhooks/razorpay",
      message: "Webhook synchronized",
      metadata: {
        eventType: parsed.data.event,
        paymentId: sync.paymentId,
        subscriptionId: sync.subscriptionId,
        verification: "verified",
        syncStatus: sync.status,
      },
    });

    return NextResponse.json({ success: true, status: sync.status, event: parsed.data.event });
  } catch (error) {
    serverLog({ level: "error", route: "api/webhooks/razorpay", message: "Webhook processing failed", error });
    return NextResponse.json({ success: false, error: "Webhook processing failed" }, { status: 500 });
  }
}