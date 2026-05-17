import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { ToolsWorkspace } from "./tools-workspace";

export default async function ToolsWorkspacePage() {
  await requireUser();

  return (
    <PageShell
      title="Premium AI Tools"
      description="Structured outputs, export-ready results, and full run history."
      actions={
        <Button asChild variant="secondary" size="sm">
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      }
    >
      <ToolsWorkspace />
    </PageShell>
  );
}
