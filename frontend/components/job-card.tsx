import Link from "next/link";

interface JobCardProps {
  id: string;
  slug: string;
  title: string;
  company: string;
  location: string;
  skills: string[];
  remote: boolean;
  publishedAt: string;
}

export default function JobCard({ slug, title, company, location, skills, remote, publishedAt }: JobCardProps) {
  return (
    <Link href={`/jobs/${slug}`} className="group block rounded-3xl border border-slate-200 bg-white p-6 shadow-card transition hover:-translate-y-1 hover:shadow-xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
          <p className="mt-1 text-sm text-slate-600">{company}</p>
        </div>
        {remote ? <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-slate-700">Remote</span> : null}
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-sm text-slate-600">
        <span>{location}</span>
        <span>•</span>
        <span>{new Date(publishedAt).toLocaleDateString()}</span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {(skills ?? []).slice(0, 4).map((skill) => (
          <span key={skill} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
            {skill}
          </span>
        ))}
      </div>
    </Link>
  );
}
