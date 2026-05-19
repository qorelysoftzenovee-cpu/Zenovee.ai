import { NextResponse } from "next/server";
import { ToolExecutionService } from "@/services/tool-execution-service";
import { getExtensionUser, getRequestIpAddress } from "@/lib/extension-auth";
import { AIProtectionError } from "@/services/ai/protection";
import { AIGenerationError, toClientErrorDetails } from "@/services/ai/prompt-orchestrator";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unexpected error occurred.";
}

export async function POST(request: Request) {
  try {
    const user = await getExtensionUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { toolId, input, options } = await request.json();
    const creditsBefore = await ToolExecutionService.getCredits(user.id);
    const result = await ToolExecutionService.execute({
      userId: user.id,
      toolId,
      rawInput: input,
      options,
      ipAddress: getRequestIpAddress(request),
      idempotencyKey: request.headers.get("x-idempotency-key"),
    });

    return NextResponse.json({
      success: true,
      data: result.output,
      executionId: result.executionId,
      usage: result.usage,
      generationMeta: result.meta,
      metrics: {
        creditsBefore,
        creditsAfter: result.remainingCredits,
      },
    });
  } catch (error) {
    if (error instanceof AIProtectionError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }

    if (error instanceof AIGenerationError) {
      return NextResponse.json({ error: error.message, code: error.code, details: toClientErrorDetails(error) }, { status: error.status });
    }

    return NextResponse.json({ error: getErrorMessage(error) }, { status: 400 });
  }
}