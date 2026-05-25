import { notFound } from "next/navigation";
import Link from "next/link";
import { requireStandardUser } from "@/lib/auth";
import { getToolDefinition } from "@/definitions";
import { ToolRunner } from "@/components/tools/tool-runner";
import { serverLog } from "@/lib/logger";

export default async function DashboardToolRunnerPage({ params }: { params: Promise<{ toolId: string }> }) {
  try {
    await requireStandardUser();
    const { toolId } = await params;
    serverLog({
      level: "info",
      route: "app/dashboard/tools/[toolId]/page",
      message: "Incoming dashboard tool route request",
      metadata: { toolId },
    });

    const tool = getToolDefinition(toolId);
    const isPublic = (tool?.metadata.visibility ?? "public") === "public";
    const isActive = (tool?.metadata.availability ?? "active") === "active";

    serverLog({
      level: "info",
      route: "app/dashboard/tools/[toolId]/page",
      message: "Resolved dashboard tool lookup",
      metadata: {
        toolId,
        hasTool: Boolean(tool),
        toolName: tool?.metadata.name ?? null,
        visibility: tool?.metadata.visibility ?? null,
        availability: tool?.metadata.availability ?? null,
        fields: tool?.fields.length ?? 0,
      },
    });

    if (!tool || !isPublic || !isActive) {
      notFound();
    }

    const clientTool = {
      id: tool.id,
      metadata: tool.metadata,
      fields: tool.fields,
      creditCost: tool.creditCost,
      presets: tool.presets ?? [],
      examples: tool.examples ?? [],
    };

    return <ToolRunner tool={clientTool} />;
  } catch (error) {
    serverLog({
      level: "error",
      route: "app/dashboard/tools/[toolId]/page",
      message: "Tool page rendering failed",
      error,
      metadata: {
        paramsType: typeof params,
      },
    });

    return (
      <main className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-xl w-full rounded-2xl border bg-card p-6 text-center space-y-3">
          <h1 className="text-xl font-semibold">We couldn’t load this tool right now</h1>
          <p className="text-sm text-muted-foreground">Please try again. You can also go back to your workspace and pick another tool.</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/dashboard/tools" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
              Back to tools
            </Link>
            <Link href="/history" className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium">
              Open history
            </Link>
          </div>
        </div>
      </main>
    );
  }
}
