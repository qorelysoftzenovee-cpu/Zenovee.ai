import Link from "next/link";
import { requireStandardUser } from "@/lib/auth";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { ToolsWorkspace } from "./tools-workspace";

export default async function ToolsWorkspacePage() {
  await requireStandardUser();

  return (
    <PageShell
      title="Tools Workspace"
      description="Use focused launch tools to generate structured SEO, ad, persona, and landing page outputs."
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
