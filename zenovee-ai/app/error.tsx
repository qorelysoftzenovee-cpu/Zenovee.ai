"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    void error;
  }, [error]);

  return (
    <main className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-lg w-full rounded-2xl border bg-card p-6 text-center space-y-3">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="text-sm text-muted-foreground">We hit a temporary issue while loading this page. Please try again.</p>
        <Button onClick={reset}>Try again</Button>
      </div>
    </main>
  );
}
