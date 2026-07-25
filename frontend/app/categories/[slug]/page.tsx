import Link from "next/link";
import { notFound } from "next/navigation";
import JobCard from "@/components/job-card";
import Pagination from "@/components/pagination";
import { getApiUrl } from "@/lib/api";
import type { Job, PaginationMeta } from "@/lib/types";

interface CategoryJobsResponse {
  category: {
    id: string;
    name: string;
    slug: string;
    icon: string;
    description: string;
    active_jobs: number;
  };
  items: Job[];
  pagination: PaginationMeta;
}

async function fetchCategoryJobs(
  slug: string,
  page: number = 1
): Promise<CategoryJobsResponse | null> {
  const apiBase = getApiUrl();
  try {
    const res = await fetch(`${apiBase}/api/categories/${encodeURIComponent(slug)}/jobs?page=${page}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

interface CategorySlugPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}

export async function generateMetadata(props: CategorySlugPageProps) {
  const params = await props.params;
  const data = await fetchCategoryJobs(params.slug, 1);
  if (!data) return { title: "Category Not Found — JobNova" };

  return {
    title: `${data.category.name} Jobs — JobNova`,
    description: data.category.description || `Browse active ${data.category.name} jobs on JobNova.`,
  };
}

export default async function CategorySlugPage(props: CategorySlugPageProps) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const page = Math.max(Number(searchParams.page) || 1, 1);

  const data = await fetchCategoryJobs(params.slug, page);
  if (!data) {
    notFound();
  }

  const { category, items, pagination } = data;

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Link href="/" className="hover:text-slate-950">Home</Link>
        <span>/</span>
        <Link href="/categories" className="hover:text-slate-950">Categories</Link>
        <span>/</span>
        <span className="text-slate-950 font-bold">{category.name}</span>
      </nav>

      {/* Hero Header */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-8 sm:p-10 shadow-card">
        <div className="flex items-start gap-5">
          <span className="text-4xl sm:text-5xl">{category.icon || "💼"}</span>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-950">
                {category.name} Jobs
              </h1>
              <span className="rounded-full bg-indigo-50 px-3 py-0.5 text-xs font-bold text-indigo-700 border border-indigo-100">
                {pagination.total} Roles
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
              {category.description}
            </p>
          </div>
        </div>
      </div>

      {/* Open Positions Feed */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-950">
            {pagination.total > 0
              ? `${pagination.total} ${category.name} ${pagination.total === 1 ? "Role" : "Roles"} Listed`
              : "No roles listed currently"}
          </h2>
        </div>

        {items.length > 0 ? (
          <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((job) => (
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
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="text-base font-semibold text-slate-700">No jobs found in this category</p>
            <p className="text-xs text-slate-400 mt-1">Check back soon for new automated job ingestions.</p>
          </div>
        )}
      </section>
    </main>
  );
}
