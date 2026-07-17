"use client";

import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-sm font-semibold text-slate-950">Something went wrong.</p>
      <button
        type="button"
        onClick={reset}
        className="rounded-3xl bg-slate-950 px-5 py-3 text-sm font-medium text-white"
      >
        Try again
      </button>
    </div>
  );
}
