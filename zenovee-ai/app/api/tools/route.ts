import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ToolEngine } from "@/engine";
import { CreditService } from "@/credit-service";

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

    const engine = new ToolEngine(user.id);
    const result = await engine.executeTool(toolId, input);

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
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 400 });
  }
}