"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getApiUrl } from "@/lib/api";
import { isJobSaved, toggleSaveJob } from "@/lib/storage";

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

export default function JobCard({
  id,
  slug,
  title,
  company,
  location,
  skills = [],
  remote,
  publishedAt,
}: JobCardProps) {
  const [saved, setSaved] = useState(false);
  const [matchScore, setMatchScore] = useState<number | null>(null);

  useEffect(() => {
    setSaved(isJobSaved(id));

    // Fetch AI match score if token exists
    const token = localStorage.getItem("jobnova_token");
    if (token && token !== "demo-jwt-token") {
      const apiBase = getApiUrl();
      fetch(`${apiBase}/api/jobs/${id}/match-score`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && typeof data.match_score === "number") {
            setMatchScore(data.match_score);
          }
        })
        .catch((err) => console.warn("Match score warning:", err));
    }
  }, [id]);

  const handleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const nextState = toggleSaveJob({ id, slug, title, company, location, remote });
    setSaved(nextState);
  };

  const getCompanyInitial = (name: string) => (name ? name.charAt(0).toUpperCase() : "C");

  const getRelativeTime = (dateStr: string) => {
    try {
      const diffDays = Math.floor(
        (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diffDays <= 0) return "Today";
      if (diffDays === 1) return "1d ago";
      if (diffDays < 30) return `${diffDays}d ago`;
      return new Date(dateStr).toLocaleDateString(undefined, { month: "short", day: "numeric" });
    } catch {
      return "Recent";
    }
  };

  return (
    <Link
      href={`/jobs/${slug}`}
      className="group relative flex flex-col justify-between rounded-3xl border border-slate-200/90 bg-white p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-2xl"
    >
      <div>
        {/* Card Header: Company Logo & Bookmark */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-slate-900 via-slate-800 to-indigo-950 font-bold text-white text-base shadow-sm group-hover:scale-105 transition-transform">
              {getCompanyInitial(company)}
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 truncate max-w-[150px]">
                {company}
              </p>
              <h3 className="text-lg font-bold text-slate-950 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                {title}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={handleBookmark}
            title={saved ? "Remove bookmark" : "Save job"}
            className={`rounded-full p-2.5 transition-all ${
              saved
                ? "bg-slate-950 text-white shadow-md"
                : "bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            }`}
          >
            <svg className="h-4 w-4" fill={saved ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
        </div>

        {/* Location, Remote & AI Fit Score Badge */}
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600">
          <span className="flex items-center gap-1">
            <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {location}
          </span>
          {remote && (
            <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-700 border border-indigo-100">
              Remote
            </span>
          )}
          {matchScore !== null && (
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-extrabold border ${
              matchScore >= 80
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : matchScore >= 55
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : "bg-slate-100 text-slate-600 border-slate-200"
            }`}>
              ⚡ {matchScore}% Match
            </span>
          )}
        </div>

        {/* Skills Pills */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {skills.slice(0, 4).map((skill) => (
            <span
              key={skill}
              className="rounded-xl bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700 border border-slate-200/60"
            >
              {skill}
            </span>
          ))}
          {skills.length > 4 && (
            <span className="rounded-xl bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-400">
              +{skills.length - 4}
            </span>
          )}
        </div>
      </div>

      {/* Card Footer */}
      <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 text-xs">
        <span className="font-medium text-slate-400">
          {getRelativeTime(publishedAt)}
        </span>
        <span className="font-semibold text-indigo-600 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
          View listing →
        </span>
      </div>
    </Link>
  );
}
