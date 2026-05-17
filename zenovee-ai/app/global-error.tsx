"use client";

import { Button } from "@/components/ui/button";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html>
      <body className="min-h-screen bg-background text-foreground">
        <main className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-lg w-full rounded-2xl border bg-card p-6 text-center space-y-3">
            <h1 className="text-xl font-semibold">We couldn’t load the app</h1>
            <p className="text-sm text-muted-foreground">Please retry. If this keeps happening, contact support.</p>
            <Button onClick={reset}>Retry</Button>
          </div>
        </main>
      </body>
    </html>
  );
}
