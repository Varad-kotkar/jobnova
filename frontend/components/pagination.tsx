"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
}

export default function Pagination({ currentPage, totalPages }: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const goToPage = useCallback(
    (page: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", String(page));
      router.push(`/?${params.toString()}`);
    },
    [router, searchParams],
  );

  // Build a window of page numbers around the current page
  const pages: number[] = [];
  const windowSize = 2;
  const start = Math.max(1, currentPage - windowSize);
  const end = Math.min(totalPages, currentPage + windowSize);
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Pagination">
      <button
        type="button"
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage <= 1}
        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-card transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        ← Previous
      </button>

      {start > 1 && (
        <>
          <button
            type="button"
            onClick={() => goToPage(1)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-card transition hover:bg-slate-50"
          >
            1
          </button>
          {start > 2 && <span className="px-1 text-slate-400">…</span>}
        </>
      )}

      {pages.map((page) => (
        <button
          key={page}
          type="button"
          onClick={() => goToPage(page)}
          className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
            page === currentPage
              ? "bg-slate-950 text-white shadow-lg shadow-slate-950/20"
              : "border border-slate-200 bg-white text-slate-600 shadow-card hover:bg-slate-50"
          }`}
        >
          {page}
        </button>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="px-1 text-slate-400">…</span>}
          <button
            type="button"
            onClick={() => goToPage(totalPages)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-card transition hover:bg-slate-50"
          >
            {totalPages}
          </button>
        </>
      )}

      <button
        type="button"
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-card transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Next →
      </button>
    </nav>
  );
}
