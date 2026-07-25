import Link from "next/link";
import { notFound } from "next/navigation";
import JobCard from "@/components/job-card";
import { getApiUrl } from "@/lib/api";

interface CompanyDetailData {
  id: string;
  name: string;
  slug: string;
  website: string;
  industry: string;
  size: string;
  headquarters: string;
  description: string;
  active_jobs: number;
  remote_jobs: number;
  locations: string[];
  jobs: Array<{
    id: string;
    slug: string;
    title: string;
    description: string;
    location: string;
    company: string;
    apply_url: string;
    skills: string[];
    remote: boolean;
    published_at: string;
  }>;
}

async function fetchCompanyBySlug(slug: string): Promise<CompanyDetailData | null> {
  const apiBase = getApiUrl();
  try {
    const res = await fetch(`${apiBase}/api/companies/${encodeURIComponent(slug)}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

interface CompanySlugPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CompanySlugPage(props: CompanySlugPageProps) {
  const params = await props.params;
  const company = await fetchCompanyBySlug(params.slug);

  if (!company) {
    notFound();
  }

  const initial = company.name ? company.name.charAt(0).toUpperCase() : "C";

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 space-y-8">
      {/* Back Link */}
      <Link href="/companies" className="text-xs font-bold text-slate-500 hover:text-slate-950 transition">
        ← Back to Companies Directory
      </Link>

      {/* Hero Banner Header */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-8 sm:p-10 shadow-card">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950 font-extrabold text-white text-2xl shadow-md">
              {initial}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-indigo-50 px-3 py-0.5 text-xs font-bold text-indigo-700 border border-indigo-100">
                  {company.industry}
                </span>
                <span className="text-xs text-slate-400">• {company.size}</span>
              </div>
              <h1 className="mt-1.5 text-3xl font-extrabold tracking-tight text-slate-950">
                {company.name}
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                HQ: <span className="font-semibold text-slate-700">{company.headquarters}</span>
              </p>
            </div>
          </div>

          <a
            href={company.website}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-800 shadow-card hover:bg-slate-50 transition text-center"
          >
            Visit Official Website ↗
          </a>
        </div>

        {/* Company Statistics Counter */}
        <div className="mt-8 grid grid-cols-3 gap-4 border-t border-slate-100 pt-6 text-center sm:text-left">
          <div>
            <p className="text-2xl font-extrabold text-slate-950">{company.active_jobs}</p>
            <p className="text-xs font-medium text-slate-500">Active Jobs</p>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-indigo-600">{company.remote_jobs}</p>
            <p className="text-xs font-medium text-slate-500">Remote Roles</p>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-slate-950">{company.locations.length}</p>
            <p className="text-xs font-medium text-slate-500">Hiring Locations</p>
          </div>
        </div>

        <div className="mt-6 border-t border-slate-100 pt-6">
          <h2 className="text-base font-bold text-slate-950 mb-2">About {company.name}</h2>
          <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
            {company.description}
          </p>
        </div>
      </div>

      {/* Open Positions Feed */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-950">
            Open Positions ({company.jobs.length})
          </h2>
        </div>

        {company.jobs.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {company.jobs.map((job) => (
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
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="text-base font-semibold text-slate-700">No open roles currently listed</p>
            <p className="text-xs text-slate-400 mt-1">New listings will automatically appear once ingested.</p>
          </div>
        )}
      </section>
    </main>
  );
}
