import Link from "next/link";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { requireStandardUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SavedOutputsPage() {
  const user = await requireStandardUser();
  const supabase = await createSupabaseServerClient();

  const { data: rows } = await supabase
    .from("tool_usage")
    .select("id,tool_name,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(30);

  return (
    <WorkspaceShell title="Saved Outputs" subtitle="Saved generations you can reopen anytime">
      <div className="space-y-4">
      <section className="premium-surface-elevated p-5 md:p-6">
        <p className="premium-label">Outputs</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">Saved outputs library</h2>
        <p className="mt-1 text-sm text-muted-foreground">All successful generations are indexed here for quick retrieval and reuse.</p>
      </section>
      <Card className="premium-surface">
        <CardHeader><CardTitle>Saved Outputs</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {(rows ?? []).length ? (
            (rows ?? []).map((row) => (
              <Link key={row.id} href={`/outputs/${row.id}`} className="block rounded-xl border border-border/70 bg-card px-3 py-2 hover:bg-muted/40">
                <p className="text-sm font-medium">{row.tool_name}</p>
                <p className="text-xs text-muted-foreground">{new Date(row.created_at).toLocaleString("en-IN")}</p>
              </Link>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No saved outputs yet.</p>
          )}
        </CardContent>
      </Card>
      </div>
    </WorkspaceShell>
  );
}
