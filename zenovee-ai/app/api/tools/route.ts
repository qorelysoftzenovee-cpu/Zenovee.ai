import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ToolEngine } from "@/engine";
import { CreditService } from "@/credit-service";
import { AIProtectionError } from "@/services/ai/protection";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unexpected error occurred.";
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { toolId, input } = await req.json();
    const creditsBefore = await CreditService.getCredits(user.id);
    const forwardedFor = req.headers.get("x-forwarded-for") ?? "";
    const ipAddress = forwardedFor.split(",")[0]?.trim() || "0.0.0.0";

    const engine = new ToolEngine(user.id);
    const result = await engine.executeTool(toolId, input, ipAddress);

    return NextResponse.json({
      success: true,
      data: result.output,
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