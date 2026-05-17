import { NextResponse } from "next/server";
import { ToolEngine } from "@/engine";
import { getExtensionUser, getRequestIpAddress } from "@/lib/extension-auth";
import { CreditService } from "@/credit-service";
import { AIProtectionError } from "@/services/ai/protection";

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

    const { toolId, input } = await request.json();
    const creditsBefore = await CreditService.getCredits(user.id);
    const engine = new ToolEngine(user.id);
    const result = await engine.executeTool(toolId, input, getRequestIpAddress(request));

    return NextResponse.json({
      success: true,
      data: result.output,
      executionId: result.executionId,
      usage: result.usage,
      metrics: {
        creditsBefore,
        creditsAfter: result.remainingCredits,
      },
    });
  } catch (error) {
    if (error instanceof AIProtectionError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }

    return NextResponse.json({ error: getErrorMessage(error) }, { status: 400 });
  }
}