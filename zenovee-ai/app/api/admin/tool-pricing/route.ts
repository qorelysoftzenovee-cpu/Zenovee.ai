import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { listToolDefinitions } from "@/definitions";
import { jsonApiError } from "@/lib/runtime";

type ToolPricingRow = {
  tool_id: string;
  credits_cost: number;
  is_active: boolean;
  cooldown_seconds: number;
  metadata: Record<string, unknown> | null;
};

const metadataSchema = z.object({
  modelOverride: z.enum(["llama-3.1-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b"]).optional(),
  systemPromptAppend: z.string().max(4000).optional(),
  userPromptAppend: z.string().max(4000).optional(),
  defaultTone: z.string().max(80).optional(),
  defaultWritingStyle: z.string().max(80).optional(),
  defaultOutputLength: z.enum(["short", "medium", "long"]).optional(),
  defaultLanguage: z.string().max(40).optional(),
  maxValidationRetries: z.number().int().min(0).max(3).optional(),
});

const updateSchema = z.object({
  toolId: z.string().min(1),
  creditsCost: z.number().int().positive(),
  isActive: z.boolean(),
  cooldownSeconds: z.number().int().min(0),
  metadata: metadataSchema.optional().default({}),
});

export async function GET() {
  try {
    const auth = await requireAdminApi();
    if ("response" in auth) return auth.response;
    const supabase = getSupabaseAdmin();
    const definitions = listToolDefinitions();
    const { data } = await supabase
      .from("tool_pricing")
      .select("tool_id,credits_cost,is_active,cooldown_seconds,metadata")
      .order("tool_id", { ascending: true });

    const pricingMap = new Map(((data ?? []) as ToolPricingRow[]).map((row) => [row.tool_id, row]));

    return NextResponse.json({
      success: true,
      data: definitions.map((tool) => {
        const pricing = pricingMap.get(tool.id);
        return {
          toolId: tool.id,
          toolName: tool.metadata.name,
          category: tool.metadata.category,
          creditsCost: Number(pricing?.credits_cost ?? tool.creditCost),
          isActive: pricing?.is_active ?? tool.metadata.availability !== "coming_soon",
          cooldownSeconds: Number(pricing?.cooldown_seconds ?? 0),
          metadata: pricing?.metadata ?? null,
        };
      }),
    });
  } catch {
    return jsonApiError("Unable to load tool pricing right now.", 500);
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireAdminApi();
    if ("response" in auth) return auth.response;

    let body: z.infer<typeof updateSchema>;
    try {
      body = updateSchema.parse(await request.json());
    } catch (error) {
      if (error instanceof z.ZodError) {
        return jsonApiError(error.issues[0]?.message ?? "Invalid tool pricing update.", 400);
      }
      throw error;
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("tool_pricing").upsert(
      {
        tool_id: body.toolId,
        credits_cost: body.creditsCost,
        is_active: body.isActive,
        cooldown_seconds: body.cooldownSeconds,
        metadata: body.metadata,
      } as never,
      { onConflict: "tool_id" }
    );

    if (error) {
      return jsonApiError("Unable to update tool pricing right now.", 400);
    }

    return NextResponse.json({ success: true });
  } catch {
    return jsonApiError("Unable to update tool pricing right now.", 500);
  }
}
