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

export function PremiumBillingSkeleton() {
  return (
    <main className="min-h-[60vh] p-4 md:p-6 lg:p-8">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <PremiumSkeleton className="h-44 rounded-[28px]" />
        <div className="grid gap-4 lg:grid-cols-3">
          <PremiumSkeleton className="h-80 rounded-[28px]" />
          <PremiumSkeleton className="h-80 rounded-[28px]" />
          <PremiumSkeleton className="h-80 rounded-[28px]" />
        </div>
        <PremiumSkeleton className="h-72 rounded-[28px]" />
      </div>
    </main>
  );
}
