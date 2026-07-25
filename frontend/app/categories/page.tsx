import Link from "next/link";
import { getApiUrl } from "@/lib/api";

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  active_jobs: number;
  top_skills: string[];
}

async function fetchCategories(search?: string, sort: string = "jobs"): Promise<CategoryItem[]> {
  const apiBase = getApiUrl();
  const query = new URLSearchParams();
  if (search?.trim()) query.set("search", search.trim());
  if (sort) query.set("sort", sort);

  try {
    const res = await fetch(`${apiBase}/api/categories?${query.toString()}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

interface CategoriesPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function CategoriesPage(props: CategoriesPageProps) {
  const searchParams = await props.searchParams;
  const search = searchParams.search || "";
  const sort = searchParams.sort || "jobs";
  const categories = await fetchCategories(search, sort);

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 space-y-8">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-8 sm:p-12 text-white shadow-xl">
        <div className="max-w-2xl space-y-3">
          <span className="rounded-full bg-indigo-500/20 px-3.5 py-1 text-xs font-semibold text-indigo-300 border border-indigo-500/30">
            Domain Category Explorer
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Browse Jobs by Tech Specialization
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Discover active engineering, AI, product, and data science roles grouped automatically by skills and job functions.
          </p>
        </div>
      </div>

      {/* Controls: Search & Sort */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div className="flex min-w-[280px] flex-1 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-card focus-within:border-slate-400">
          <svg className="h-5 w-5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <form method="GET" className="w-full">
            <input
              name="search"
              defaultValue={search}
              placeholder="Search categories (e.g. Frontend, AI, Cloud)..."
              className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
            />
          </form>
        </div>

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
            </select>
          </form>
        </div>
      </div>

      {/* Categories Grid */}
      <section>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-950">
            {categories.length} Categories Available
          </h2>
        </div>

        {categories.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="flex flex-col justify-between rounded-3xl border border-slate-200/90 bg-white p-6 shadow-card hover:border-slate-300 hover:shadow-xl transition group"
              >
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl group-hover:scale-110 transition-transform">{cat.icon}</span>
                      <h3 className="text-lg font-bold text-slate-950 group-hover:text-indigo-600 transition">
                        {cat.name}
                      </h3>
                    </div>
                    <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-bold text-indigo-700 border border-indigo-100">
                      {cat.active_jobs} {cat.active_jobs === 1 ? "Role" : "Roles"}
                    </span>
                  </div>

                  <p className="mt-3 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {cat.description}
                  </p>

                  {cat.top_skills && cat.top_skills.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {cat.top_skills.map((skill) => (
                        <span key={skill} className="rounded-xl bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-6 border-t border-slate-100 pt-4 flex items-center justify-between">
                  <Link
                    href={`/categories/${cat.slug}` as any}
                    className="text-xs font-bold text-indigo-600 hover:underline"
                  >
                    Explore Category →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="text-base font-semibold text-slate-700">No categories found</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your search query.</p>
          </div>
        )}
      </section>
    </main>
  );
}
