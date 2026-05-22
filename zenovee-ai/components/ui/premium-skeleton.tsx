import { cn } from "@/lib/utils";

export function PremiumSkeleton({ className }: { className?: string }) {
  return <div className={cn("loading-skeleton rounded-2xl bg-muted/60", className)} />;
}

export function PremiumPageSkeleton() {
  return (
    <main className="min-h-[60vh] p-6">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <PremiumSkeleton className="h-24 rounded-3xl" />
        <div className="grid gap-6 lg:grid-cols-2">
          <PremiumSkeleton className="h-64 rounded-3xl" />
          <PremiumSkeleton className="h-64 rounded-3xl" />
        </div>
      </div>
    </main>
  );
}
