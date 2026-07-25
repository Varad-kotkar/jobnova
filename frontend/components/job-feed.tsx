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
    <section>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">
            {hasActiveFilters ? "Search results" : "Latest listings"}
          </p>

          <h2 className="text-2xl font-semibold text-slate-950">
            {pagination.total > 0
              ? `${pagination.total} job${pagination.total === 1 ? "" : "s"} found`
              : "Jobs for you"}
          </h2>
        </div>
      </div>

      {items.length > 0 ? (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
            <div className="mt-8">
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
        <div className="mt-4 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="mb-4 h-12 w-12 text-slate-300"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3A2.25 2.25 0 008.25 5.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z"
            />
          </svg>

          <p className="text-base font-semibold text-slate-800">
            No matching jobs found
          </p>

          <p className="mt-1 max-w-sm text-sm text-slate-500">
            {hasActiveFilters
              ? "We couldn't find any jobs matching your active search criteria. Try removing filters or modifying keywords."
              : "New job listings will automatically appear here as soon as they are ingested."}
          </p>

          {hasActiveFilters && (
            <Link
              href="/jobs"
              className="mt-5 rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-slate-800 transition"
            >
              Clear All Filters
            </Link>
          )}
        </div>
      )}
    </section>
  );
}