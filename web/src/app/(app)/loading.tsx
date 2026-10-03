export default function Loading() {
  return (
    <div className="space-y-6" role="status" aria-label="Cargando">
      <div className="h-64 animate-pulse rounded-3xl bg-white/5" />
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-white/5" />)}
      </div>
      <span className="sr-only">Cargando…</span>
    </div>
  );
}
