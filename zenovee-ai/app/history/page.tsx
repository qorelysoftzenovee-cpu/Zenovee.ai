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
    <WorkspaceShell title="History">
      <HistoryClient initialRows={rows ?? []} />
    </WorkspaceShell>
  );
}