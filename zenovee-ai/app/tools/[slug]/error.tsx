"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PublicToolError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-xl w-full rounded-[28px] border border-slate-200 bg-white p-6 text-center shadow-[0_24px_54px_-34px_rgba(15,23,42,0.22)] space-y-4">
        <div className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
          Tool page unavailable
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">This tool page is having trouble loading</h1>
        <p className="text-sm leading-7 text-slate-600">
          Please try again, or return to the tools directory to open another workflow.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button onClick={reset}>Retry page</Button>
          <Button asChild variant="outline">
            <Link href="/tools">Browse tools</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}