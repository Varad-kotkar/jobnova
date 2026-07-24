import Link from "next/link";

export default function JobNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12">
        <p className="text-4xl font-semibold text-slate-950">404</p>
        <p className="mt-2 text-sm text-slate-600">This job listing could not be found.</p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          ← Back to all jobs
        </Link>
      </div>
    </div>
  );
}
