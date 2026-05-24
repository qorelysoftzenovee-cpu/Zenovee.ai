import dynamic from "next/dynamic";
import { requireStandardUser } from "@/lib/auth";

const ToolsWorkspace = dynamic(
  () => import("./tools-workspace").then((mod) => mod.ToolsWorkspace),
  {
    loading: () => <div className="h-40 animate-pulse rounded-2xl border border-slate-200 bg-white" />,
  }
);

export default async function ToolsWorkspacePage() {
  await requireStandardUser();

  return <ToolsWorkspace />;
}
