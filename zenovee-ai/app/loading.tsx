export default function Loading() {
  return (
    <main className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-lg w-full rounded-2xl border bg-card p-6 space-y-4">
        <div className="h-5 w-40 animate-pulse rounded bg-muted" />
        <div className="h-4 w-full animate-pulse rounded bg-muted" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
      </div>
    </main>
  );
}
