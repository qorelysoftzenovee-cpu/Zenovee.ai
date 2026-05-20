import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/auth/logout-button";
import { requireStandardUser } from "@/lib/auth";
import { SUPPORT_EMAIL } from "@/lib/seo/site";

export default async function SettingsPage() {
  const user = await requireStandardUser();

  return (
    <PageShell
      title="Settings"
      description="Manage account access, billing visibility, and support shortcuts for your workspace."
      actions={
        <Button asChild variant="secondary" size="sm">
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      }
    >
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
                <a href={`mailto:${SUPPORT_EMAIL}`}>Email support</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}