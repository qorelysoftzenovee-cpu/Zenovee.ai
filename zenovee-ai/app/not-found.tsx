import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="max-w-lg w-full rounded-2xl border bg-card p-6 text-center space-y-3">
        <h1 className="text-xl font-semibold">Page not found</h1>
        <p className="text-sm text-muted-foreground">The page you’re looking for doesn’t exist or may have moved.</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link href="/">Back to home</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/pricing">View pricing</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
