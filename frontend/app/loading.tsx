function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <div className="h-5 w-3/4 rounded bg-slate-200" />
          <div className="mt-2 h-4 w-1/2 rounded bg-slate-100" />
        </div>
        <div className="h-6 w-16 rounded-full bg-slate-100" />
      </div>
      <div className="mt-4 flex gap-2">
        <div className="h-4 w-20 rounded bg-slate-100" />
        <div className="h-4 w-24 rounded bg-slate-100" />
      </div>
      <div className="mt-4 flex gap-2">
        <div className="h-6 w-16 rounded-full bg-slate-100" />
        <div className="h-6 w-20 rounded-full bg-slate-100" />
        <div className="h-6 w-14 rounded-full bg-slate-100" />
      </div>
    </div>
  );
}

export default function LoadingPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <section className="mb-10">
        <div className="animate-pulse">
          <div className="h-10 w-80 rounded bg-slate-200" />
          <div className="mt-3 h-4 w-64 rounded bg-slate-100" />
        </div>
      </section>
      <section>
        <div className="mb-6">
          <div className="h-3 w-24 rounded bg-slate-200" />
          <div className="mt-2 h-7 w-36 rounded bg-slate-200" />
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </section>
    </main>
  );
}
