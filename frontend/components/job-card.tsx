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

  return (
    <div className="group relative rounded-2xl border border-gray-200 bg-white p-5 shadow-card hover:border-gray-300 transition">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-900 font-bold text-white text-base">
            {getCompanyInitial(company)}
          </div>

          <div className="space-y-1">
            <Link href={`/jobs/${slug}`} className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition">
              {title}
            </Link>
            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 font-medium">
              <span className="font-semibold text-gray-800">{company}</span>
              <span>•</span>
              <span>{location}</span>
              {remote && (
                <span className="rounded-md bg-emerald-50 px-2 py-0.5 font-bold text-emerald-700 border border-emerald-200 text-[11px]">
                  Remote
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {matchScore !== null && (
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 border border-blue-200">
              ⚡ {matchScore}% Match
            </span>
          )}
          <button
            type="button"
            onClick={handleBookmark}
            className={`rounded-lg p-2 transition ${
              saved ? "text-blue-600 bg-blue-50" : "text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            }`}
            title={saved ? "Remove from saved" : "Save job"}
          >
            <svg className="h-5 w-5" fill={saved ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
        </div>
      </div>

      {skills.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5 pt-3 border-t border-gray-100">
          {skills.slice(0, 5).map((skill) => (
            <span key={skill} className="rounded-md bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-700">
              {skill}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
