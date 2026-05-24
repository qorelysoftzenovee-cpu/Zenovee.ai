import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireStandardUser } from "@/lib/auth";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
  const user = await requireStandardUser();

  return (
    <WorkspaceShell title="Settings">
      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="border-slate-200 bg-white">
          <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">Name</p>
            <p className="mt-1 text-sm font-medium">Workspace User</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white">
          <CardHeader><CardTitle>Email</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm font-medium">{user.email}</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white">
          <CardHeader><CardTitle>Password Reset</CardTitle></CardHeader>
          <CardContent>
            <Link href="/auth/callback" className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
              Start Password Reset
            </Link>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white">
          <CardHeader><CardTitle>Theme Toggle</CardTitle></CardHeader>
          <CardContent>
            <SettingsClient />
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white lg:col-span-2">
          <CardHeader><CardTitle>Support</CardTitle></CardHeader>
          <CardContent>
            <Link href="/contact" className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
              Open Support Page
            </Link>
          </CardContent>
        </Card>
      </div>
    </WorkspaceShell>
  );
}