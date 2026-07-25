"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface CompanyControlsProps {
  initialSearch: string;
  initialSort: string;
}

export default function CompanyControls({ initialSearch, initialSort }: CompanyControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const searchVal = formData.get("search")?.toString().trim() || "";
    const params = new URLSearchParams(searchParams.toString());
    if (searchVal) {
      params.set("search", searchVal);
    } else {
      params.delete("search");
    }
    const target = params.toString() ? `/companies?${params.toString()}` : "/companies";
    router.push(target as any);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sortVal = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", sortVal);
    const target = `/companies?${params.toString()}`;
    router.push(target as any);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
      <div className="flex min-w-[280px] flex-1 items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 shadow-subtle focus-within:border-blue-600 focus-within:bg-white transition">
        <svg className="h-4 w-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <form onSubmit={handleSearchSubmit} className="w-full">
          <input
            name="search"
            defaultValue={initialSearch}
            placeholder="Search company by name..."
            className="w-full bg-transparent text-xs text-gray-900 outline-none placeholder:text-gray-400"
          />
        </form>
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 shadow-subtle">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Sort</span>
        <select
          name="sort"
          defaultValue={initialSort}
          onChange={handleSortChange}
          className="bg-transparent text-xs font-semibold text-gray-900 outline-none cursor-pointer"
        >
          <option value="jobs">Most Open Jobs</option>
          <option value="name">Alphabetical (A-Z)</option>
          <option value="recent">Recently Posted</option>
        </select>
      </div>
    </div>
  );
}
