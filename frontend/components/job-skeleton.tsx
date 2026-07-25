export default function JobSkeleton() {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-card animate-pulse">
      <div>
        <div className="flex items-center justify-between gap-3">
          <div className="h-6 w-28 rounded-full bg-slate-200" />
          <div className="h-4 w-16 rounded bg-slate-100" />
        </div>

        <div className="mt-4 h-6 w-3/4 rounded-md bg-slate-200" />
        <div className="mt-2 h-4 w-1/2 rounded-md bg-slate-100" />

        <div className="mt-4 flex flex-wrap gap-1.5">
          <div className="h-6 w-16 rounded-lg bg-slate-100" />
          <div className="h-6 w-20 rounded-lg bg-slate-100" />
          <div className="h-6 w-14 rounded-lg bg-slate-100" />
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
        <div className="h-4 w-24 rounded bg-slate-100" />
        <div className="h-8 w-20 rounded-xl bg-slate-200" />
      </div>
    </div>
  );
}
