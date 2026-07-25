import JobCard from "@/components/job-card";
import Pagination from "@/components/pagination";
import { getApiUrl } from "@/lib/api";
import type { Job, JobListResponse } from "@/lib/types";
import Link from "next/link";

const PAGE_SIZE = 12;

interface JobFeedProps {
  searchParams: Record<string, string | undefined>;
}

async function fetchJobs(
  params: Record<string, string | undefined>
): Promise<JobListResponse> {
  const page = Math.max(Number(params.page) || 1, 1);

  const query = new URLSearchParams();
  query.set("page", String(page));
  query.set("page_size", String(PAGE_SIZE));

  if (params.keyword?.trim()) {
    query.set("keyword", params.keyword.trim());
  }

  if (params.company?.trim()) {
    query.set("company", params.company.trim());
  }

  if (params.location?.trim()) {
    query.set("location", params.location.trim());
  }

  if (params.remote === "true") {
    query.set("remote", "true");
  }

  if (params.sort_by) {
    query.set("sort_by", params.sort_by);
  }

  const apiBase = getApiUrl();
  const fetchUrl = `${apiBase}/api/jobs?${query.toString()}`;

  try {
    const res = await fetch(fetchUrl, {
      next: { revalidate: 30 },
    });

    if (!res.ok) {
      console.warn(`Failed to fetch jobs (${res.status}): ${res.statusText}`);
      return {
        items: [],
        pagination: {
          page: 1,
          page_size: PAGE_SIZE,
          total: 0,
          total_pages: 1,
          has_next: false,
          has_previous: false,
        },
      };
    }

    return res.json();
  } catch (error) {
    console.warn("Error fetching jobs:", error);

    return {
      items: [],
      pagination: {
        page: 1,
        page_size: PAGE_SIZE,
        total: 0,
        total_pages: 1,
        has_next: false,
        has_previous: false,
      },
    };
  }
}

export default async function JobFeed({ searchParams }: JobFeedProps) {
  const data = await fetchJobs(searchParams);
  const { pagination, items } = data;

  const hasActiveFilters =
    !!searchParams.keyword ||
    !!searchParams.company ||
    !!searchParams.location ||
    searchParams.remote === "true" ||
    (!!searchParams.sort_by && searchParams.sort_by !== "newest");

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
            {hasActiveFilters ? "Search Results" : "Live Directory Feed"}
          </p>
          <h2 className="text-lg font-extrabold text-gray-900">
            {pagination.total > 0
              ? `${pagination.total} Verified Role${pagination.total === 1 ? "" : "s"} Available`
              : "Hiring Listings"}
          </h2>
        </div>
      </div>

      {items.length > 0 ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((job: Job) => (
              <JobCard
                key={job.id}
                id={job.id}
                slug={job.slug}
                title={job.title}
                company={job.company}
                location={job.location}
                skills={job.skills ?? []}
                remote={job.remote}
                publishedAt={job.published_at}
              />
            ))}
          </div>

          {pagination.total_pages > 1 && (
            <div className="mt-8 pt-4 border-t border-gray-100">
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.total_pages}
                hasNext={pagination.has_next}
                hasPrevious={pagination.has_previous}
              />
            </div>
          )}
        </>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-subtle space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-bold text-xl">
            🔍
          </div>

          <div>
            <h3 className="text-base font-bold text-gray-900">No matching listings found</h3>
            <p className="mt-1 text-xs text-gray-500 max-w-sm mx-auto">
              {hasActiveFilters
                ? "No active listings matched your specific filter keywords. Try searching for broader terms or exploring popular skill categories."
                : "Continuous scraper pipeline is active. New listings will automatically appear here."}
            </p>
          </div>

          <div className="pt-2 flex flex-wrap justify-center gap-2 text-xs">
            <span className="font-semibold text-gray-400 self-center">Try searching:</span>
            {["Frontend", "Backend", "Full Stack", "Python", "React", "Remote"].map((term) => (
              <Link
                key={term}
                href={`/jobs?keyword=${encodeURIComponent(term.toLowerCase())}`}
                className="rounded-lg bg-gray-50 px-3 py-1 font-semibold text-gray-700 border border-gray-200 hover:border-blue-600 hover:text-blue-600 transition"
              >
                {term}
              </Link>
            ))}
          </div>

          {hasActiveFilters && (
            <div className="pt-2">
              <Link
                href="/jobs"
                className="inline-block rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-subtle hover:bg-blue-700 transition"
              >
                Reset All Search Filters
              </Link>
            </div>
          )}
        </div>
      )}
    </section>
  );
}