import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { requireStandardUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ExportsPage() {
  const user = await requireStandardUser();
  const supabase = await createSupabaseServerClient();

  const { data: exports } = await supabase
    .from("generation_history")
    .select("id,file_type,storage_path,created_at")
    .eq("user_id", user.id)
    .not("storage_path", "is", null)
    .order("created_at", { ascending: false })
    .limit(30);

  return (
    <WorkspaceShell title="Exports" subtitle="All export files in one place">
      <div className="space-y-4">
      <section className="premium-surface-elevated p-5 md:p-6">
        <p className="premium-label">Exports</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">Export center</h2>
        <p className="mt-1 text-sm text-muted-foreground">Track every generated file and access your exported assets from one place.</p>
      </section>
      <Card className="premium-surface">
        <CardHeader><CardTitle>Exports</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {(exports ?? []).length ? (
            (exports ?? []).map((item) => (
              <div key={item.id} className="rounded-xl border border-border/70 bg-card px-3 py-2">
                <p className="text-sm font-medium">{(item.file_type ?? "file").toUpperCase()}</p>
                <p className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleString("en-IN")}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No exports yet.</p>
          )}
        </CardContent>
      </Card>
      </div>
    </WorkspaceShell>
  );
}
