import { requireStandardUser } from "@/lib/auth";
import dynamic from "next/dynamic";
import { Suspense } from "react";

const ToolsWorkspace = dynamic(
  () => import("./tools-workspace").then((mod) => mod.ToolsWorkspace),
  {
    ssr: false,
    loading: () => (
      <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
        <div className="loading-skeleton h-[420px] rounded-3xl" />
        <div className="loading-skeleton h-[620px] rounded-3xl" />
      </div>
    ),
  }
);

export default async function ToolsWorkspacePage() {
  await requireStandardUser();

  return (
    <div className="space-y-5">
      <section className="surface-card p-5 md:p-6">
        <p className="premium-label">Workspaces</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">AI Workspace Console</h1>
        <p className="mt-2 text-sm text-muted-foreground">Operate LinkedIn, SEO, sales outreach, conversion copy, and brand studio workflows from one focused environment.</p>
      </section>
      <Suspense
        fallback={
          <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
            <div className="loading-skeleton h-[420px] rounded-3xl" />
            <div className="loading-skeleton h-[620px] rounded-3xl" />
          </div>
        }
      >
        <ToolsWorkspace />
      </Suspense>
    </div>
  );
}
