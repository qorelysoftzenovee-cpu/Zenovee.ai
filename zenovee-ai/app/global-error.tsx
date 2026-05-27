"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html>
      <body className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.08),transparent_35%),#f8fafc] text-foreground">
        <main className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-xl w-full rounded-[32px] border border-slate-200 bg-white/92 p-8 text-center shadow-[0_32px_80px_-42px_rgba(15,23,42,0.24)] backdrop-blur-xl space-y-4">
            <div className="inline-flex rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-rose-700">
              Global app recovery
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">We couldn’t load Zenovee correctly</h1>
            <p className="text-sm leading-7 text-slate-600">
              A temporary application issue interrupted the experience. You can retry safely, or return home and reopen the product.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button onClick={reset}>Retry app</Button>
              <Button asChild variant="outline">
                <Link href="/">Back to home</Link>
              </Button>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
