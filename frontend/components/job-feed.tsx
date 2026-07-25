import JobCard from "@/components/job-card";
import Pagination from "@/components/pagination";
import type { Job, JobListResponse } from "@/lib/types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:8000";

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

  try {
    const res = await fetch(`${API_BASE}/api/jobs?${query.toString()}`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      console.warn("Failed to fetch jobs:", res.statusText);
      return {
        items: [],
        total: 0,
        page: 1,
        page_size: PAGE_SIZE,
      };
    }

    return res.json();
  } catch (error) {
    console.warn("Error fetching jobs:", error);

    return {
      items: [],
      total: 0,
      page: 1,
      page_size: PAGE_SIZE,
    };
  }
}

export default async function JobFeed({
  searchParams,
}: JobFeedProps) {
  const data = await fetchJobs(searchParams);

  const currentPage = Math.max(Number(searchParams.page) || 1, 1);
  const totalPages = Math.max(
    Math.ceil(data.total / PAGE_SIZE),
    1
  );

  const hasActiveFilters =
    !!searchParams.keyword ||
    !!searchParams.company ||
    !!searchParams.location ||
    searchParams.remote === "true";

  return (
    <section>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">
            {hasActiveFilters ? "Search results" : "Latest listings"}
          </p>

          <h2 className="text-2xl font-semibold text-slate-950">
            {data.total > 0
              ? `${data.total} job${data.total === 1 ? "" : "s"} found`
              : "Jobs for you"}
          </h2>
        </div>
      </div>

      {data.items.length > 0 ? (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((job: Job) => (
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

          {totalPages > 1 && (
            <div className="mt-8">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
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

          <p className="text-base font-medium text-slate-600">
            No jobs found
          </p>

          <p className="mt-1 text-sm text-slate-400">
            {hasActiveFilters
              ? "Try adjusting your search or clearing filters."
              : "New jobs will appear here once they are ingested."}
          </p>
        </div>
      )}
    </section>
  );
}