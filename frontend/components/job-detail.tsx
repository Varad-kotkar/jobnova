"use client";

import { useEffect, useState } from "react";
import { sanitizeHtml } from "@/lib/sanitize";
import { isJobSaved, toggleSaveJob, recordJobApplication } from "@/lib/storage";

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
  const [saved, setSaved] = useState(false);
  const [applied, setApplied] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setSaved(isJobSaved(job.id));
  }, [job.id]);

  const handleBookmark = () => {
    const next = toggleSaveJob({
      id: job.id,
      slug: job.slug,
      title: job.title,
      company: job.company,
      location: job.location,
      remote: job.remote,
    });
    setSaved(next);
  };

  const handleApplyClick = () => {
    recordJobApplication({
      id: job.id,
      slug: job.slug,
      title: job.title,
      company: job.company,
    });
    setApplied(true);
    window.open(job.apply_url, "_blank", "noopener,noreferrer");
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignored
    }
  };

  const isHtml = /<[a-z][\s\S]*>/i.test(job.description);
  const cleanDescription = isHtml ? sanitizeHtml(job.description) : null;
  const companyInitial = job.company ? job.company.charAt(0).toUpperCase() : "C";

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      {/* Left Main Column */}
      <div className="lg:col-span-2 space-y-6">
        {/* Main Job Card Header */}
        <article className="rounded-3xl border border-slate-200/90 bg-white p-8 shadow-card">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-900 font-extrabold text-white text-xl shadow-md">
                {companyInitial}
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                  {job.company}
                </p>
                <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-950">
                  {job.title}
                </h1>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                  <span className="flex items-center gap-1">
                    <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    {job.location}
                  </span>
                  <span>•</span>
                  <span className="rounded-full bg-slate-100 px-3 py-0.5 text-xs font-semibold text-slate-700">
                    {job.remote ? "Remote" : "On-site"}
                  </span>
                  <span>•</span>
                  <span className="text-xs text-slate-400">
                    Posted {new Date(job.published_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-slate-100 pt-8">
            <h2 className="text-xl font-bold text-slate-950 mb-4">Job Description</h2>
            {cleanDescription ? (
              <div
                className="prose max-w-none text-slate-700 leading-relaxed space-y-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:text-lg [&_h3]:font-medium [&_p]:mb-3"
                dangerouslySetInnerHTML={{ __html: cleanDescription }}
              />
            ) : (
              <p className="whitespace-pre-line text-base leading-relaxed text-slate-700">
                {job.description}
              </p>
            )}
          </div>

          {job.skills && job.skills.length > 0 && (
            <div className="mt-8 border-t border-slate-100 pt-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-3">
                Skills & Technologies
              </h3>
              <div className="flex flex-wrap gap-2">
                {job.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-xl bg-slate-100 px-3.5 py-1.5 text-xs font-semibold text-slate-700 border border-slate-200"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </article>

        {/* Company Profile Box */}
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-card">
          <h3 className="text-lg font-bold text-slate-950">About {job.company}</h3>
          <p className="mt-2 text-xs text-slate-600 leading-relaxed">
            {job.company} is hiring verified talent through JobNova. Explore more roles from {job.company} or learn about their mission and values on their official career portal.
          </p>
        </div>
      </div>

      {/* Right Sticky Sidebar */}
      <div className="lg:col-span-1">
        <div className="sticky top-24 space-y-5">
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-card space-y-4">
            <button
              type="button"
              onClick={handleApplyClick}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 py-3.5 text-sm font-semibold text-white shadow-lg hover:bg-slate-800 transition"
            >
              {applied ? "Applied ✓ (Re-open Link)" : "Apply Now →"}
            </button>

            <button
              type="button"
              onClick={handleBookmark}
              className={`flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                saved
                  ? "border-slate-950 bg-slate-950 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              <svg className="h-4 w-4" fill={saved ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              {saved ? "Saved to Bookmarks" : "Save Job"}
            </button>

            <div className="border-t border-slate-100 pt-4 space-y-3 text-xs text-slate-600">
              <div className="flex justify-between">
                <span className="text-slate-400">Workplace</span>
                <span className="font-semibold text-slate-900">{job.remote ? "Remote" : "On-site"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Location</span>
                <span className="font-semibold text-slate-900">{job.location}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Posted</span>
                <span className="font-semibold text-slate-900">
                  {new Date(job.published_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 flex gap-2">
              <button
                type="button"
                onClick={handleShare}
                className="flex-1 rounded-xl border border-slate-200 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                {copied ? "Link Copied! ✓" : "Share Job"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
