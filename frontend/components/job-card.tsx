"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Bookmark, MapPin, Building2, DollarSign, CheckCircle2, Sparkles, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { getApiUrl } from "@/lib/api";
import { toggleSaveJob } from "@/lib/storage";

export interface JobCardProps {
  job?: {
    id: string;
    title: string;
    slug: string;
    description?: string;
    location: string;
    remote: boolean;
    published_at: string;
    skills?: string[];
    salary_range?: string;
    visa_sponsorship?: boolean;
    company?: {
      name: string;
      slug?: string;
      logo_url?: string;
      verified?: boolean;
    };
  };
  id?: string;
  title?: string;
  slug?: string;
  description?: string;
  company?: string | { name: string; slug?: string; logo_url?: string; verified?: boolean };
  location?: string;
  skills?: string[];
  remote?: boolean;
  publishedAt?: string;
  isLoading?: boolean;
  onBookmarkToggle?: (jobId: string, isSaved: boolean) => void;
  isBookmarked?: boolean;
}

export function CompanyLogo({ name, logoUrl }: { name: string; logoUrl?: string }) {
  const [imgError, setImgError] = useState(false);
  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "JN";

  if (logoUrl && !imgError) {
    return (
      <img
        src={logoUrl}
        alt={`${name} logo`}
        className="w-12 h-12 rounded-xl object-contain bg-slate-50 p-1 border border-slate-100 shadow-sm"
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold text-base flex items-center justify-center shadow-md shadow-blue-500/10">
      {initials}
    </div>
  );
}

export function JobCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm animate-pulse flex flex-col justify-between h-full">
      <div>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-200" />
            <div>
              <div className="w-28 h-4 bg-slate-200 rounded mb-2" />
              <div className="w-40 h-5 bg-slate-200 rounded" />
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-200" />
        </div>
        <div className="space-y-2 mb-4">
          <div className="w-full h-3 bg-slate-200 rounded" />
          <div className="w-4/5 h-3 bg-slate-200 rounded" />
        </div>
      </div>
      <div className="flex items-center gap-2 pt-4 border-t border-slate-50">
        <div className="w-16 h-6 bg-slate-200 rounded-full" />
        <div className="w-20 h-6 bg-slate-200 rounded-full" />
      </div>
    </div>
  );
}

export function JobCard(props: JobCardProps) {
  const { isLoading, onBookmarkToggle, isBookmarked = false } = props;
  const [saved, setSaved] = useState(isBookmarked);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const job = props.job || {
    id: props.id || "",
    title: props.title || "Engineering Role",
    slug: props.slug || props.id || "",
    description: props.description || "Engineering listing with competitive compensation and benefits.",
    location: props.location || "Remote",
    remote: props.remote ?? true,
    published_at: props.publishedAt || new Date().toISOString(),
    skills: props.skills || [],
    company: typeof props.company === "string" ? { name: props.company } : props.company,
  };

  if (isLoading || !job || !job.id) {
    return <JobCardSkeleton />;
  }

  const companyName = typeof job.company === "string" ? job.company : job.company?.name || "Verified Employer";
  const logoUrl = typeof job.company === "object" ? job.company?.logo_url : undefined;
  const isVerifiedCompany = typeof job.company === "object" ? job.company?.verified !== false : true;

  useEffect(() => {
    if (token) {
      const apiBase = getApiUrl();
      fetch(`${apiBase}/api/jobs/saved`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => (res.ok ? res.json() : []))
        .then((savedList) => {
          if (Array.isArray(savedList)) {
            const isFound = savedList.some((s: any) => s.id === job.id || s.job_id === job.id);
            if (isFound) setSaved(true);
          }
        })
        .catch((err) => console.warn("Saved jobs sync warning:", err));
    }
  }, [job.id, token]);

  const handleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const nextSaved = !saved;
    setSaved(nextSaved);
    setToastMsg(nextSaved ? "Job saved to your bookmarks!" : "Removed from bookmarks");
    setTimeout(() => setToastMsg(null), 2500);

    toggleSaveJob(
      {
        id: job.id,
        slug: job.slug || job.id,
        title: job.title,
        company: companyName,
        location: job.location,
        remote: job.remote,
      },
      token
    );

    if (onBookmarkToggle) {
      onBookmarkToggle(job.id, nextSaved);
    }
  };

  const isNew = job.published_at && new Date().getTime() - new Date(job.published_at).getTime() < 7 * 24 * 3600 * 1000;

  // Location collapse logic
  const locs = job.location.split(",");
  const displayLocation = locs[0].trim();
  const extraLocCount = locs.length > 1 ? locs.length - 1 : 0;

  return (
    <div className="relative group bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all duration-300 flex flex-col justify-between h-full">
      {toastMsg && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs font-medium px-3 py-1.5 rounded-full shadow-lg z-20 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          {toastMsg}
        </div>
      )}

      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-3">
            <CompanyLogo name={companyName} logoUrl={job.company?.logo_url} />
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <span>{companyName}</span>
                {job.company?.verified !== false && (
                  <span title="Verified Employer" className="text-blue-600">
                    <ShieldCheck className="w-3.5 h-3.5 inline" />
                  </span>
                )}
              </div>
              <Link
                href={`/jobs/${job.slug || job.id}`}
                className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1"
              >
                {job.title}
              </Link>
            </div>
          </div>

          <button
            onClick={handleBookmark}
            aria-label={saved ? "Remove bookmark" : "Save job"}
            className={`p-2 rounded-xl border transition-all ${
              saved
                ? "bg-blue-50 border-blue-200 text-blue-600 scale-105"
                : "bg-slate-50 border-slate-100 text-slate-400 hover:text-slate-600 hover:border-slate-200"
            }`}
          >
            <Bookmark className={`w-4 h-4 ${saved ? "fill-blue-600" : ""}`} />
          </button>
        </div>

        {/* Description snippet */}
        <p className="text-sm text-slate-600 line-clamp-2 mb-4 leading-relaxed">
          {(job.description || "").replace(/<[^>]*>?/gm, "")}
        </p>

        {/* Skills */}
        {job.skills && job.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {job.skills.slice(0, 4).map((skill, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 text-xs font-medium bg-slate-100 text-slate-700 rounded-lg group-hover:bg-blue-50 group-hover:text-blue-700 transition-colors"
              >
                {skill}
              </span>
            ))}
            {job.skills.length > 4 && (
              <span className="px-2 py-1 text-xs font-medium text-slate-400">+{job.skills.length - 4} more</span>
            )}
          </div>
        )}
      </div>

      {/* Footer Badges & Meta */}
      <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-3 text-slate-500 font-medium">
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            {displayLocation}
            {extraLocCount > 0 && <span className="text-blue-600 font-semibold"> +{extraLocCount} more</span>}
          </span>

          {job.remote && (
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200/60">
              Remote
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isNew && (
            <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white font-bold text-[10px] tracking-wide uppercase flex items-center gap-1 shadow-sm shadow-blue-500/20">
              <Sparkles className="w-2.5 h-2.5" /> NEW
            </span>
          )}
          {job.visa_sponsorship && (
            <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-semibold border border-purple-200/60">
              Visa Provided
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default JobCard;
