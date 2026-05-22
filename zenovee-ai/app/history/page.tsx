import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireStandardUser } from "@/lib/auth";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { HistoryClient } from "./history-client";

export default async function HistoryPage() {
  const user = await requireStandardUser();
  const supabase = await createSupabaseServerClient();

  const { data: rows } = await supabase
    .from("tool_usage")
    .select("id,tool_id,tool_name,output,credits_consumed,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(24);

  return (
    <WorkspaceShell title="History" subtitle="Track outputs, activity, and exports">
      <div className="space-y-6">
        <section className="surface-card p-5 md:p-6">
          <p className="premium-label">History</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">Generation History</h1>
          <p className="mt-2 text-sm text-muted-foreground">Reopen winning outputs, export deliverables, and keep your workflow auditable.</p>
        </section>

        <HistoryClient initialRows={rows ?? []} />
      </div>
    </WorkspaceShell>
  );
}