import { notFound } from "next/navigation";
import { requireStandardUser } from "@/lib/auth";
import { getToolDefinition } from "@/definitions";
import { ToolRunner } from "@/components/tools/tool-runner";

export default async function DashboardToolRunnerPage({ params }: { params: Promise<{ toolId: string }> }) {
  await requireStandardUser();
  const { toolId } = await params;
  const tool = getToolDefinition(toolId);
  if (!tool || (tool.metadata.visibility ?? "public") !== "public" || tool.metadata.availability !== "active") {
    notFound();
  }

  return <ToolRunner tool={tool} />;
}
