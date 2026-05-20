import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireStandardUser } from "@/lib/auth";

export default async function HistoryPage() {
  await requireStandardUser();

  return (
    <PageShell
      title="History"
      description="Review your recent generations inside the tools workspace. Start by generating your first AI asset."
      actions={
        <Button asChild variant="secondary" size="sm">
          <Link href="/dashboard/tools">Open tools workspace</Link>
        </Button>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>Generation history</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Your recent generations, saved outputs, and exports are available in the tools workspace for a more reliable single workflow.</p>
        </CardContent>
      </Card>
    </PageShell>
  );
}