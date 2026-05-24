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
      <Card className="border-slate-200 bg-white">
        <CardHeader><CardTitle>Saved Outputs</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {(rows ?? []).length ? (
            (rows ?? []).map((row) => (
              <Link key={row.id} href={`/outputs/${row.id}`} className="block rounded-lg border border-slate-200 px-3 py-2 hover:bg-slate-50">
                <p className="text-sm font-medium">{row.tool_name}</p>
                <p className="text-xs text-muted-foreground">{new Date(row.created_at).toLocaleString("en-IN")}</p>
              </Link>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No saved outputs yet.</p>
          )}
        </CardContent>
      </Card>
    </WorkspaceShell>
  );
}
