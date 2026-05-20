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
      description="Your recent generations, saved outputs, and exports live in the tools workspace so everything stays in one reliable flow."
      actions={
        <Button asChild variant="secondary" size="sm">
          <Link href="/dashboard/tools">Open tools workspace</Link>
        </Button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Generation history</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>Open the tools workspace to review recent runs, reopen strong outputs, duplicate older briefs, and export finished results.</p>
            <Button asChild>
              <Link href="/dashboard/tools">Go to workspace history</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Saved outputs and exports</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>Use the Saved tab to keep your strongest outputs close, then export them whenever you need TXT, Markdown, PDF, or JSON.</p>
            <Button asChild variant="secondary">
              <Link href="/billing">Review billing</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}