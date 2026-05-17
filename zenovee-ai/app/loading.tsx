export default function Loading() {
  return (
    <main className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-lg w-full rounded-2xl border bg-card p-6 text-center space-y-3">
        <h1 className="text-xl font-semibold">Loading...</h1>
        <p className="text-sm text-muted-foreground">Please wait while we prepare the page.</p>
      </div>
    </main>
  );
}
