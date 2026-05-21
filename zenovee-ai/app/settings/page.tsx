import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/auth/logout-button";
import { requireStandardUser } from "@/lib/auth";
import { WorkspaceShell } from "@/components/layout/workspace-shell";

export default async function SettingsPage() {
  const user = await requireStandardUser();

  return (
    <WorkspaceShell title="Settings" subtitle="Account, preferences, and support shortcuts">
    <div className="space-y-6">
      <section className="surface-card p-5 md:p-6">
        <p className="premium-label">Settings</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">Account & Workspace Settings</h1>
        <p className="mt-2 text-sm text-muted-foreground">Manage access, billing shortcuts, and support channels from one clean panel.</p>
      </section>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="surface-muted p-4 text-sm">
              <p className="text-muted-foreground">Signed in as</p>
              <p className="mt-1 font-medium text-foreground">{user.email}</p>
            </div>
            <LogoutButton />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Billing and support</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>Review your plan, subscription actions, and payment confidence details from billing.</p>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/billing">Open billing</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/contact">Contact support</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </WorkspaceShell>
  );
}