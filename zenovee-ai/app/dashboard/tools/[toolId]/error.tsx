"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardToolError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-xl w-full rounded-[28px] border border-slate-200 bg-white p-6 text-center shadow-[0_24px_54px_-34px_rgba(15,23,42,0.22)] space-y-4">
        <div className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
          Tool session issue
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">We couldn’t open this tool correctly</h1>
        <p className="text-sm leading-7 text-slate-600">
          The tool encountered a temporary loading problem. Your workspace is still available and you can retry safely.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button onClick={reset}>Retry tool</Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/tools">Back to tools</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}