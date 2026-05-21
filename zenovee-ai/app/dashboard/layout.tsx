import type { ReactNode } from "react";
import { requireStandardUser } from "@/lib/auth";
import { WorkspaceShell } from "@/components/layout/workspace-shell";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  await requireStandardUser();

  return <WorkspaceShell>{children}</WorkspaceShell>;
}
