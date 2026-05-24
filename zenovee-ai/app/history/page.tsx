import { requireStandardUser } from "@/lib/auth";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function HistoryPage() {
  const user = await requireStandardUser();
  const supabase = await createSupabaseServerClient();

  const { data: rows } = await supabase
    .from("tool_usage")
    .select("id,tool_name,credits_consumed,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(24);

  return (
    <WorkspaceShell title="History">
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="text-left text-xs text-slate-500">
            <tr>
              <th className="px-4 py-3">Tool Used</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Credits Used</th>
              <th className="px-4 py-3">Reopen</th>
              <th className="px-4 py-3">Export</th>
            </tr>
          </thead>
          <tbody>
            {(rows ?? []).map((row) => (
              <tr key={row.id} className="border-t border-slate-200">
                <td className="px-4 py-3 font-medium">{row.tool_name}</td>
                <td className="px-4 py-3 text-slate-600">{formatDate(row.created_at)}</td>
                <td className="px-4 py-3">{row.credits_consumed}</td>
                <td className="px-4 py-3">
                  <a href={`/outputs/${row.id}`} className="rounded-md border border-slate-200 px-2 py-1 text-xs hover:bg-slate-50">Reopen</a>
                </td>
                <td className="px-4 py-3">
                  <a href={`/outputs/${row.id}`} className="rounded-md border border-slate-200 px-2 py-1 text-xs hover:bg-slate-50">Export</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </WorkspaceShell>
  );
}