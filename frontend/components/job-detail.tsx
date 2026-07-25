import { sanitizeHtml } from "@/lib/sanitize";

interface JobDetailProps {
  job: {
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
  };
}

export default function JobDetail({ job }: JobDetailProps) {
  const isHtml = /<[a-z][\s\S]*>/i.test(job.description);
  const cleanDescription = isHtml ? sanitizeHtml(job.description) : null;

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-8 shadow-card">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-wider text-slate-500">
            {job.company}
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">
            {job.title}
          </h1>
          <div className="mt-3 flex flex-wrap gap-2 text-sm text-slate-600">
            <span>{job.location}</span>
            <span>•</span>
            <span>{job.remote ? "Remote" : "On-site"}</span>
          </div>
        </div>
        <a
          href={job.apply_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center rounded-3xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 shadow-md"
        >
          Apply now
        </a>
      </div>

      <div className="mt-8 space-y-6 text-slate-700">
        <div>
          <h2 className="text-xl font-semibold text-slate-950 mb-3">
            Job Description
          </h2>
          {cleanDescription ? (
            <div
              className="prose max-w-none space-y-4 text-slate-700 leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:text-lg [&_h3]:font-medium [&_p]:mb-3"
              dangerouslySetInnerHTML={{ __html: cleanDescription }}
            />
          ) : (
            <p className="whitespace-pre-line leading-relaxed text-slate-700">
              {job.description}
            </p>
          )}
        </div>

        {job.skills && job.skills.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-slate-950">Skills</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {job.skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700 border border-slate-200"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
