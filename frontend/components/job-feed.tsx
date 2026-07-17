import JobCard from "@/components/job-card";

async function fetchJobs() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000"}/api/jobs?page=1&page_size=10`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) {
    throw new Error("Failed to fetch jobs");
  }
  return res.json();
}

export default async function JobFeed() {
  const data = await fetchJobs();

  return (
    <section>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">Latest listings</p>
          <h2 className="text-2xl font-semibold text-slate-950">Jobs for you</h2>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {data.items.map((job: any) => (
          <JobCard
            key={job.id}
            slug={job.slug}
            title={job.title}
            company={job.company}
            location={job.location}
            skills={job.skills}
            remote={job.remote}
            publishedAt={job.published_at}
          />
        ))}
      </div>

      {data.items.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 text-slate-600 shadow-card">
          No jobs found. Try adjusting your filters.
        </div>
      ) : null}
    </section>
  );
}
