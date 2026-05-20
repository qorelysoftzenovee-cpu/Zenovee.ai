import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/auth/logout-button";
import { requireStandardUser } from "@/lib/auth";

export default async function SettingsPage() {
  const user = await requireStandardUser();

  return (
    <PageShell
      title="Settings"
      description="Basic account access settings for your launch workspace."
      actions={
        <Button asChild variant="secondary" size="sm">
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      }
    >
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
    </PageShell>
  );
}