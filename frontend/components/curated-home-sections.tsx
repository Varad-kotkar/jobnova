"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, MapPin, Globe, GraduationCap, UserCheck, Sparkles, Building2 } from "lucide-react";
import { JobCard, JobCardSkeleton } from "@/components/job-card";
import { getHomeJobs, HomeJobsData } from "@/lib/api";

interface CuratedHomeSectionsProps {
  initialData?: HomeJobsData | null;
}

export default function CuratedHomeSections({ initialData }: CuratedHomeSectionsProps) {
  const [data, setData] = useState<HomeJobsData | null>(initialData || null);
  const [loading, setLoading] = useState<boolean>(!initialData);

  useEffect(() => {
    getHomeJobs()
      .then((res) => {
        if (res) setData(res);
      })
      .catch((err) => console.warn("Error loading home jobs:", err))
      .finally(() => setLoading(false));
  }, []);

  const renderSectionHeader = (title: string, subtitle: string, icon: React.ReactNode, viewAllHref: string, countText: string) => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 mb-6 gap-2">
      <div>
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-xl bg-blue-50 text-blue-600 font-bold">{icon}</span>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">{title}</h2>
        </div>
        <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
      </div>
      <Link
        href={viewAllHref as any}
        className="inline-flex items-center gap-1.5 text-xs font-extrabold text-blue-600 hover:text-blue-800 hover:underline shrink-0"
      >
        View All {countText} <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );

  const renderSkeletons = () => (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <JobCardSkeleton key={i} />
      ))}
    </div>
  );

  const renderGrid = (jobs: any[]) => {
    if (!jobs || jobs.length === 0) {
      return (
        <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center bg-slate-50/50">
          <p className="text-xs font-semibold text-slate-500">No listings matching this filter right now.</p>
          <p className="text-[11px] text-slate-400 mt-1">Check back shortly or explore our full jobs catalog.</p>
        </div>
      );
    }

    return (
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {jobs.slice(0, 12).map((j: any) => (
          <JobCard key={j.id} job={j} />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-16">
      {/* 🇮🇳 1. Latest India Jobs */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        {renderSectionHeader(
          "🇮🇳 Latest India Engineering Jobs",
          "Top developer, analyst, and tech roles in Pune, Bengaluru, Hyderabad, Mumbai & Remote-India",
          <MapPin className="w-5 h-5" />,
          "/jobs?location=India",
          "India Jobs →"
        )}
        {loading ? renderSkeletons() : renderGrid(data?.india_jobs || [])}
      </section>

      {/* 🌍 2. Fully Remote Jobs */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        {renderSectionHeader(
          "🌍 Fully Remote & Work From Home Roles",
          "Work from anywhere in the world with flexible global remote opportunities",
          <Globe className="w-5 h-5" />,
          "/jobs?remote=true",
          "Remote Jobs →"
        )}
        {loading ? renderSkeletons() : renderGrid(data?.remote_jobs || [])}
      </section>

      {/* 🎓 3. Internships */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        {renderSectionHeader(
          "🎓 Internships & Trainee Positions",
          "Kickstart your career with internships in Software, Data, AI, and Product",
          <GraduationCap className="w-5 h-5" />,
          "/jobs?keyword=internship",
          "Internships →"
        )}
        {loading ? renderSkeletons() : renderGrid(data?.internships || [])}
      </section>

      {/* 👨🎓 4. Freshers & Graduate Roles */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        {renderSectionHeader(
          "👨‍🎓 Freshers & Entry Level Roles",
          "Entry-level, associate, and campus hiring roles for new graduates",
          <UserCheck className="w-5 h-5" />,
          "/jobs?keyword=fresher",
          "Fresher Roles →"
        )}
        {loading ? renderSkeletons() : renderGrid(data?.freshers || [])}
      </section>

      {/* ⚡ 5. Latest Tech Roles */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        {renderSectionHeader(
          "⚡ Fresh Tech Listings (Last 30 Days)",
          "Published within the last 30 days across verified hiring portals",
          <Sparkles className="w-5 h-5" />,
          "/jobs",
          "Full Job Catalog →"
        )}
        {loading ? renderSkeletons() : renderGrid(data?.latest || [])}
      </section>
    </div>
  );
}
