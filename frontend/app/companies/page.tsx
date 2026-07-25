import Link from "next/link";
import CompanyControls from "@/components/company-controls";
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
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 space-y-8 bg-white">
      {/* Header Banner */}
      <div className="border-b border-gray-100 pb-6 space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
          Employers & Corporate Hiring Portals 🏢
        </h1>
        <p className="text-xs text-gray-500 max-w-2xl leading-relaxed">
          Discover tech companies actively recruiting software engineers. Indexed directly from official corporate hiring portals.
        </p>
      </div>

      {/* Client Controls Bar */}
      <CompanyControls initialSearch={search} initialSort={sort} />

      {/* Companies Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
          <h2 className="text-base font-bold text-gray-900">
            {companies.length} Hiring Companies Listed
          </h2>
        </div>

        {companies.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {companies.map((comp) => {
              const initial = comp.name ? comp.name.charAt(0).toUpperCase() : "C";
              return (
                <div
                  key={comp.id}
                  className="flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-5 shadow-card hover:border-gray-300 transition"
                >
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-900 font-bold text-white text-base">
                          {initial}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-gray-900 line-clamp-1">{comp.name}</h3>
                          <p className="text-[11px] text-gray-500">{comp.industry || "Software & Technology"}</p>
                        </div>
                      </div>

                      {comp.remote_jobs > 0 && (
                        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                          Remote
                        </span>
                      )}
                    </div>

                    <div className="mt-4 flex items-center gap-3 text-xs font-semibold text-gray-700">
                      <span className="rounded-md bg-gray-100 px-2.5 py-1 text-[11px]">
                        {comp.active_jobs} Open {comp.active_jobs === 1 ? "Role" : "Roles"}
                      </span>
                      {comp.headquarters && (
                        <span className="text-gray-500 text-[11px] truncate max-w-[140px]">
                          📍 {comp.headquarters}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 border-t border-gray-100 pt-3 flex items-center justify-between">
                    <Link
                      href={`/companies/${comp.slug}` as any}
                      className="text-xs font-bold text-blue-600 hover:underline"
                    >
                      Company Profile →
                    </Link>
                    <Link
                      href={`/jobs?company=${encodeURIComponent(comp.name)}` as any}
                      className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white shadow-subtle hover:bg-gray-800 transition"
                    >
                      View Roles
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-subtle space-y-3">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-bold text-lg">
              🏢
            </div>
            <h3 className="text-base font-bold text-gray-900">No companies match your search</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Try modifying your search keywords or explore popular employers listed across tech hubs.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
