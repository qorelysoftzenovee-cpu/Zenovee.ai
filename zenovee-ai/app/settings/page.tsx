import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireStandardUser } from "@/lib/auth";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
  const user = await requireStandardUser();

  return (
    <WorkspaceShell title="Settings">
      <div className="space-y-4">
        <section className="premium-surface-elevated p-5 md:p-6">
          <p className="premium-label">Settings</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">Account and workspace controls</h2>
          <p className="mt-1 text-sm text-muted-foreground">Manage profile, security, billing access, support, and session controls.</p>
        </section>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="premium-surface">
          <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">Name</p>
            <p className="mt-1 text-sm font-medium">Workspace User</p>
          </CardContent>
        </Card>

        <Card className="premium-surface">
          <CardHeader><CardTitle>Email</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm font-medium">{user.email}</p>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <SettingsClient email={user.email} />
        </div>

        <Card className="premium-surface lg:col-span-2">
          <CardHeader><CardTitle>Support</CardTitle></CardHeader>
          <CardContent>
            <Link href="/contact" className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
              Open Support Page
            </Link>
          </CardContent>
        </Card>
      </div>
      </div>
    </WorkspaceShell>
  );
}