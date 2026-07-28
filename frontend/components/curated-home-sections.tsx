"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, MapPin, Globe, GraduationCap, UserCheck, Sparkles } from "lucide-react";
import { JobCard, JobCardSkeleton } from "@/components/job-card";
import { getHomeJobs, HomeJobsData, JobData, SectionMeta } from "@/lib/api";

interface CuratedHomeSectionsProps {
  initialData?: HomeJobsData | null;
}

// Icon map for each section key
const SECTION_ICONS: Record<string, React.ReactNode> = {
  india_jobs: <MapPin className="w-5 h-5" />,
  remote_jobs: <Globe className="w-5 h-5" />,
  internships: <GraduationCap className="w-5 h-5" />,
  freshers: <UserCheck className="w-5 h-5" />,
  latest: <Sparkles className="w-5 h-5" />,
};

export default function CuratedHomeSections({ initialData }: CuratedHomeSectionsProps) {
  const [data, setData] = useState<HomeJobsData | null>(initialData || null);
  const [loading, setLoading] = useState<boolean>(!initialData);

  useEffect(() => {
    getHomeJobs()
      .then((res) => { if (res) setData(res); })
      .catch((err) => console.warn("Error loading home jobs:", err))
      .finally(() => setLoading(false));
  }, []);

  const renderSectionHeader = (
    section: SectionMeta,
  ) => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 mb-6 gap-2">
      <div>
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-xl bg-blue-50 text-blue-600 font-bold">
            {SECTION_ICONS[section.key] || <Sparkles className="w-5 h-5" />}
          </span>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">{section.title}</h2>
        </div>
        {section.subtitle && (
          <p className="text-xs text-slate-500 mt-1">{section.subtitle}</p>
        )}
      </div>
      {section.view_all_href && (
        <Link
          href={section.view_all_href as any}
          className="inline-flex items-center gap-1.5 text-xs font-extrabold text-blue-600 hover:text-blue-800 hover:underline shrink-0"
        >
          {section.view_all_label || "View All"} <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      )}
    </div>
  );

  const renderSkeletons = () => (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <JobCardSkeleton key={i} />
      ))}
    </div>
  );

  const renderGrid = (jobs: JobData[]) => {
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

  // ─── DB-Driven sections ───────────────────────────────────────────────────
  // Use sections config if available; fall back to hardcoded defaults
  const sections: SectionMeta[] = data?.sections?.length
    ? data.sections.filter(
        (s) => s.enabled && s.key !== "developer_corner" && s.key !== "trending_companies"
      )
    : [
        { key: "india_jobs", title: "🇮🇳 Latest India Jobs", subtitle: "Top tech roles in Bengaluru, Pune, Hyderabad & Mumbai", enabled: true, order: 1, view_all_href: "/jobs?country=India", view_all_label: "View All India Jobs", limit: 12 },
        { key: "remote_jobs", title: "🌍 Fully Remote Jobs", subtitle: "Work from anywhere — global remote opportunities", enabled: true, order: 2, view_all_href: "/jobs?remote=true", view_all_label: "View All Remote Jobs", limit: 12 },
        { key: "internships", title: "🎓 Internship Opportunities", subtitle: "Kickstart your career with internships in Software, Data, AI & Product", enabled: true, order: 3, view_all_href: "/jobs?employment_type=Internship", view_all_label: "View All Internships", limit: 12 },
        { key: "freshers", title: "👨‍🎓 Freshers & Graduate Jobs", subtitle: "Entry-level, associate and campus hiring for new graduates", enabled: true, order: 4, view_all_href: "/jobs?experience_level=Fresher", view_all_label: "View All Fresher Jobs", limit: 12 },
        { key: "latest", title: "⚡ Recently Added", subtitle: "Freshest tech listings published in the last 30 days", enabled: true, order: 6, view_all_href: "/jobs", view_all_label: "View Full Catalog", limit: 12 },
      ];

  const getJobsForSection = (key: string): JobData[] => {
    if (data?.section_data?.[key]) return data.section_data[key];
    // Backward-compatible fallback
    if (key === "india_jobs") return data?.india_jobs || [];
    if (key === "remote_jobs") return data?.remote_jobs || [];
    if (key === "internships") return data?.internships || [];
    if (key === "freshers") return data?.freshers || [];
    if (key === "latest") return data?.latest || [];
    return [];
  };

  return (
    <div className="space-y-16">
      {sections.map((section) => (
        <section key={section.key} className="mx-auto max-w-7xl px-4 sm:px-6">
          {renderSectionHeader(section)}
          {loading ? renderSkeletons() : renderGrid(getJobsForSection(section.key))}
        </section>
      ))}
    </div>
  );
}
