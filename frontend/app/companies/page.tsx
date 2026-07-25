import Link from "next/link";
import { getApiUrl } from "@/lib/api";

interface CompanyItem {
  id: string;
  name: string;
  slug: string;
  website: string;
  industry: string;
  size: string;
  headquarters: string;
  active_jobs: number;
  remote_jobs: number;
  locations: string[];
}

async function fetchCompanies(search?: string, sort: string = "jobs"): Promise<CompanyItem[]> {
  const apiBase = getApiUrl();
  const query = new URLSearchParams();
  if (search?.trim()) query.set("search", search.trim());
  if (sort) query.set("sort", sort);

  try {
    const res = await fetch(`${apiBase}/api/companies?${query.toString()}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

interface CompaniesPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function CompaniesPage(props: CompaniesPageProps) {
  const searchParams = await props.searchParams;
  const search = searchParams.search || searchParams.keyword || "";
  const sort = searchParams.sort || "jobs";
  const companies = await fetchCompanies(search, sort);

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 space-y-8">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-8 sm:p-12 text-white shadow-xl">
        <div className="max-w-2xl space-y-3">
          <span className="rounded-full bg-indigo-500/20 px-3.5 py-1 text-xs font-semibold text-indigo-300 border border-indigo-500/30">
            Hiring Companies Directory
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Top Tech Employers & Hiring Portals
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Discover verified companies actively recruiting tech talent. Indexed directly from official Greenhouse, Lever, and Ashby portals.
          </p>
        </div>
      </div>

      {/* Controls Bar: Search & Sort */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div className="flex min-w-[280px] flex-1 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-card focus-within:border-slate-400">
          <svg className="h-5 w-5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <form method="GET" className="w-full">
            <input
              name="search"
              defaultValue={search}
              placeholder="Search by company name..."
              className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
            />
          </form>
        </div>

        {/* Sorting Dropdown */}
        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-card">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sort</span>
          <form method="GET" className="inline">
            {search && <input type="hidden" name="search" value={search} />}
            <select
              name="sort"
              defaultValue={sort}
              onChange={(e) => e.target.form?.submit()}
              className="bg-transparent text-sm font-medium text-slate-900 outline-none cursor-pointer"
            >
              <option value="jobs">Most Open Jobs</option>
              <option value="name">Alphabetical (A-Z)</option>
              <option value="recent">Recently Posted</option>
            </select>
          </form>
        </div>
      </div>

      {/* Companies Grid */}
      <section>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-950">
            {companies.length} Hiring Companies
          </h2>
        </div>

        {companies.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {companies.map((comp) => {
              const initial = comp.name ? comp.name.charAt(0).toUpperCase() : "C";
              return (
                <div
                  key={comp.id}
                  className="flex flex-col justify-between rounded-3xl border border-slate-200/90 bg-white p-6 shadow-card hover:border-slate-300 hover:shadow-xl transition"
                >
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3.5">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950 font-extrabold text-white text-lg shadow-sm">
                          {initial}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-950 line-clamp-1">{comp.name}</h3>
                          <p className="text-xs text-slate-400">{comp.industry || "Technology"}</p>
                        </div>
                      </div>

                      {comp.remote_jobs > 0 && (
                        <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-bold text-indigo-700 border border-indigo-100">
                          Remote
                        </span>
                      )}
                    </div>

                    <div className="mt-4 flex items-center gap-3 text-xs font-semibold text-slate-700">
                      <span className="rounded-lg bg-slate-100 px-2.5 py-1">
                        {comp.active_jobs} Open {comp.active_jobs === 1 ? "Role" : "Roles"}
                      </span>
                      {comp.headquarters && (
                        <span className="text-slate-500 truncate max-w-[140px]">
                          📍 {comp.headquarters}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 border-t border-slate-100 pt-4 flex items-center justify-between">
                    <Link
                      href={`/companies/${comp.slug}` as any}
                      className="text-xs font-bold text-indigo-600 hover:underline"
                    >
                      Company Profile →
                    </Link>
                    <Link
                      href={`/jobs?company=${encodeURIComponent(comp.name)}` as any}
                      className="rounded-xl bg-slate-950 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition"
                    >
                      View Roles
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="text-base font-semibold text-slate-700">No companies match your search</p>
            <p className="text-xs text-slate-400 mt-1">Try searching for a different company name.</p>
          </div>
        )}
      </section>
    </main>
  );
}
