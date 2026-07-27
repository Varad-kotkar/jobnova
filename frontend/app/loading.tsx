export default function Loading() {
  return (
    <main className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-20">
      <div className="space-y-6 text-center">
        {/* Pulsing logo placeholder */}
        <div className="mx-auto h-12 w-12 rounded-2xl bg-blue-100 animate-pulse" />
        <div className="space-y-3">
          <div className="mx-auto h-4 w-48 rounded-lg bg-slate-100 animate-pulse" />
          <div className="mx-auto h-3 w-32 rounded-lg bg-slate-50 animate-pulse" />
        </div>
        {/* Skeleton cards */}
        <div className="max-w-2xl mx-auto grid gap-4 pt-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-slate-100 bg-white p-6 space-y-3 animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-slate-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-3/4 rounded bg-slate-100" />
                  <div className="h-2.5 w-1/2 rounded bg-slate-50" />
                </div>
              </div>
              <div className="h-2 w-full rounded bg-slate-50" />
              <div className="h-2 w-2/3 rounded bg-slate-50" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
