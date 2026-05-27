"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    void error;
  }, [error]);

  return (
    <main className="min-h-[70vh] flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.08),transparent_35%),#f8fafc]">
      <div className="max-w-xl w-full rounded-[32px] border border-slate-200 bg-white/92 p-8 text-center shadow-[0_32px_80px_-42px_rgba(15,23,42,0.24)] backdrop-blur-xl space-y-4">
        <div className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
          Temporary issue
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">We hit a loading problem</h1>
        <p className="text-sm leading-7 text-slate-600">
          This page didn’t finish loading correctly, but your workspace is still safe. Retry now or return to the dashboard.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button onClick={reset}>Retry now</Button>
          <Button asChild variant="outline">
            <Link href="/dashboard">Go to dashboard</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
