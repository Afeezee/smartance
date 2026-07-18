export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="h-6 w-40 animate-pulse rounded bg-border" />
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="h-28 animate-pulse rounded-lg bg-border/70" />
        <div className="h-28 animate-pulse rounded-lg bg-border/70" />
      </div>
    </div>
  );
}
