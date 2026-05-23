import { requireStandardUser } from "@/lib/auth";
import { ToolsWorkspace } from "./tools-workspace";

export default async function ToolsWorkspacePage() {
  await requireStandardUser();

  return (
    <div className="space-y-5">
      <section className="surface-card p-5 md:p-6 text-foreground">
        <p className="premium-label text-primary/90">Workspaces</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">AI Workspace Console</h1>
        <p className="mt-2 text-sm text-slate-300">Operate LinkedIn, SEO, sales outreach, conversion copy, and brand studio workflows from one focused environment.</p>
      </section>
      <ToolsWorkspace />
    </div>
  );
}
