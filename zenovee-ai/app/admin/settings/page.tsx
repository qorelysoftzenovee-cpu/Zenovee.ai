import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";
import { env } from "@/lib/env";

export default async function AdminSettingsPage() {
  await requireAdmin();

  const configuredAdminEmail = env.ADMIN_EMAIL?.trim() || "Not configured";
  const sqlSnippet = `select public.promote_user_to_admin('admin@yourdomain.com');`;

  return (
    <PageShell title="Admin settings" description="Operational configuration, initial admin assignment, and production-safe setup guidance." variant="admin" className="bg-transparent">
      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="admin-surface">
          <CardHeader><CardTitle>Initial admin setup</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-300">
            <p>
              This deployment supports secure initial admin assignment through the <code className="rounded bg-white/10 px-1.5 py-0.5 text-white">ADMIN_EMAIL</code> environment variable.
              When that user signs in, their role is server-upgraded to <code className="rounded bg-white/10 px-1.5 py-0.5 text-white">admin</code>.
            </p>
            <div className="admin-row">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Configured admin email</p>
              <p className="mt-2 break-all font-medium text-white">{configuredAdminEmail}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="admin-surface">
          <CardHeader><CardTitle>Secure SQL promotion</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-300">
            <p>If you need to promote the first admin manually, use the secure SQL helper from a service-role session or Supabase SQL editor:</p>
            <pre className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/80 p-4 text-xs text-cyan-200"><code>{sqlSnippet}</code></pre>
            <p>The helper updates the role server-side and keeps the role model aligned with admin-only route protection.</p>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}