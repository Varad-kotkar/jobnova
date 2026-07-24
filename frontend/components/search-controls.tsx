"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

export default function SearchControls() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [keyword, setKeyword] = useState(searchParams.get("keyword") ?? "");
  const [location, setLocation] = useState(searchParams.get("location") ?? "");
  const [remote, setRemote] = useState(searchParams.get("remote") === "true");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pushParams = useCallback(
    (newKeyword: string, newLocation: string, newRemote: boolean) => {
      const params = new URLSearchParams();
      const trimmedKeyword = newKeyword.trim();
      const trimmedLocation = newLocation.trim();

      if (trimmedKeyword) params.set("keyword", trimmedKeyword);
      if (trimmedLocation) params.set("location", trimmedLocation);
      if (newRemote) params.set("remote", "true");
      // always reset to page 1 when filters change
      params.set("page", "1");

      const qs = params.toString();
      router.push(qs ? `/?${qs}` : "/");
    },
    [router],
  );

  const debouncedPush = useCallback(
    (newKeyword: string, newLocation: string, newRemote: boolean) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        pushParams(newKeyword, newLocation, newRemote);
      }, 350);
    },
    [pushParams],
  );

  // Sync state from URL on navigation (e.g. back button)
  useEffect(() => {
    setKeyword(searchParams.get("keyword") ?? "");
    setLocation(searchParams.get("location") ?? "");
    setRemote(searchParams.get("remote") === "true");
  }, [searchParams]);

  const handleKeywordChange = (value: string) => {
    setKeyword(value);
    debouncedPush(value, location, remote);
  };

  const handleLocationChange = (value: string) => {
    setLocation(value);
    pushParams(keyword, value, remote);
  };

  const handleRemoteToggle = () => {
    const next = !remote;
    setRemote(next);
    pushParams(keyword, location, next);
  };

  const showClear = keyword.length > 0 || location.length > 0 || remote;

  const handleClear = () => {
    setKeyword("");
    setLocation("");
    setRemote(false);
    router.push("/");
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {/* Keyword search */}
      <div className="flex min-w-[280px] flex-1 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-card focus-within:border-slate-400 focus-within:ring-1 focus-within:ring-slate-400 transition">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 text-slate-400">
          <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
        </svg>
        <input
          value={keyword}
          onChange={(e) => handleKeywordChange(e.target.value)}
          placeholder="Search jobs, titles, skills, or companies…"
          className="w-full border-none bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
        />
      </div>

      {/* Location search */}
      <div className="flex min-w-[180px] items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-card focus-within:border-slate-400 focus-within:ring-1 focus-within:ring-slate-400 transition">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 text-slate-400">
          <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.274 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clipRule="evenodd" />
        </svg>
        <input
          value={location}
          onChange={(e) => handleLocationChange(e.target.value)}
          placeholder="Location…"
          className="w-full border-none bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
        />
      </div>

      {/* Remote toggle */}
      <button
        type="button"
        onClick={handleRemoteToggle}
        className={`rounded-2xl px-5 py-3 text-sm font-medium transition ${
          remote
            ? "bg-slate-950 text-white shadow-lg shadow-slate-950/20"
            : "bg-white text-slate-700 border border-slate-200 shadow-card hover:border-slate-300"
        }`}
      >
        Remote
      </button>

      {/* Clear filters */}
      {showClear ? (
        <button
          type="button"
          onClick={handleClear}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 shadow-card transition hover:bg-slate-50"
        >
          Clear
        </button>
      ) : null}
    </div>
  );
}
