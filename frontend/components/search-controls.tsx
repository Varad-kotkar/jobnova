"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

export default function SearchControls() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [keyword, setKeyword] = useState(searchParams.get("keyword") ?? "");
  const [company, setCompany] = useState(searchParams.get("company") ?? "");
  const [location, setLocation] = useState(searchParams.get("location") ?? "");
  const [remote, setRemote] = useState(searchParams.get("remote") === "true");
  const [sortBy, setSortBy] = useState(searchParams.get("sort_by") ?? "newest");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pushParams = useCallback(
    (
      newKeyword: string,
      newCompany: string,
      newLocation: string,
      newRemote: boolean,
      newSortBy: string
    ) => {
      const params = new URLSearchParams();
      const trimmedKeyword = newKeyword.trim();
      const trimmedCompany = newCompany.trim();
      const trimmedLocation = newLocation.trim();

      if (trimmedKeyword) params.set("keyword", trimmedKeyword);
      if (trimmedCompany) params.set("company", trimmedCompany);
      if (trimmedLocation) params.set("location", trimmedLocation);
      if (newRemote) params.set("remote", "true");
      if (newSortBy && newSortBy !== "newest") params.set("sort_by", newSortBy);
      params.set("page", "1");

      const qs = params.toString();
      const targetPath = pathname.startsWith("/jobs") ? "/jobs" : "/jobs";
      router.push(qs ? `${targetPath}?${qs}` : targetPath, { scroll: false });
    },
    [router, pathname]
  );

  const debouncedPush = useCallback(
    (
      newKeyword: string,
      newCompany: string,
      newLocation: string,
      newRemote: boolean,
      newSortBy: string
    ) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        pushParams(newKeyword, newCompany, newLocation, newRemote, newSortBy);
      }, 350);
    },
    [pushParams]
  );

  useEffect(() => {
    setKeyword(searchParams.get("keyword") ?? "");
    setCompany(searchParams.get("company") ?? "");
    setLocation(searchParams.get("location") ?? "");
    setRemote(searchParams.get("remote") === "true");
    setSortBy(searchParams.get("sort_by") ?? "newest");
  }, [searchParams]);

  const handleKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setKeyword(val);
    debouncedPush(val, company, location, remote, sortBy);
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocation(val);
    debouncedPush(keyword, company, val, remote, sortBy);
  };

  const handleRemoteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.checked;
    setRemote(val);
    pushParams(keyword, company, location, val, sortBy);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSortBy(val);
    pushParams(keyword, company, location, remote, val);
  };

  const handleClearFilters = () => {
    setKeyword("");
    setCompany("");
    setLocation("");
    setRemote(false);
    setSortBy("newest");
    router.push("/jobs");
  };

  const hasActiveFilters = Boolean(keyword || company || location || remote || sortBy !== "newest");

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-subtle space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="relative flex items-center">
          <svg className="absolute left-3.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={keyword}
            onChange={handleKeywordChange}
            placeholder="Search job title, skills..."
            className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 py-2.5 text-xs font-medium text-gray-900 placeholder-gray-400 outline-none focus:border-blue-600 focus:bg-white transition"
          />
        </div>

        <div className="relative flex items-center">
          <svg className="absolute left-3.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
          <input
            type="text"
            value={location}
            onChange={handleLocationChange}
            placeholder="Location, city..."
            className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 py-2.5 text-xs font-medium text-gray-900 placeholder-gray-400 outline-none focus:border-blue-600 focus:bg-white transition"
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <select
            value={sortBy}
            onChange={handleSortChange}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs font-semibold text-gray-800 outline-none focus:border-blue-600 transition"
          >
            <option value="newest">Sort by: Newest</option>
            <option value="relevance">Sort by: Relevance</option>
            <option value="oldest">Sort by: Oldest</option>
          </select>

          <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer shrink-0 border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50">
            <input
              type="checkbox"
              checked={remote}
              onChange={handleRemoteChange}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Remote
          </label>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex justify-end pt-1">
          <button
            onClick={handleClearFilters}
            className="text-xs font-semibold text-gray-500 hover:text-gray-900 transition"
          >
            Clear all filters ✕
          </button>
        </div>
      )}
    </div>
  );
}
