"use client";

import React, { useState } from "react";
import Link from "next/link";
import { TrendingCompany } from "@/lib/api";
import { ShieldCheck, Briefcase } from "lucide-react";

interface TrendingCompaniesProps {
  companies: TrendingCompany[];
}

function CompanyLogo({ name, logoUrl }: { name: string; logoUrl?: string }) {
  const encodedName = encodeURIComponent(name || "Company");
  const avatarFallback = `https://ui-avatars.com/api/?name=${encodedName}&background=0284c7&color=ffffff&bold=true`;
  const initialSrc = logoUrl && logoUrl.trim().length > 0 ? logoUrl : avatarFallback;

  const [src, setSrc] = useState(initialSrc);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (src !== avatarFallback) {
      setSrc(avatarFallback);
    } else {
      setHasError(true);
    }
  };

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  if (hasError) {
    return (
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold text-base flex items-center justify-center shadow-md shadow-blue-500/15 shrink-0">
        {initials}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={`${name} logo`}
      onError={handleError}
      className="w-14 h-14 rounded-2xl object-contain bg-white border border-slate-200/70 p-1.5 shadow-sm shrink-0"
    />
  );
}

export default function TrendingCompanies({ companies }: TrendingCompaniesProps) {
  if (!companies || companies.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span className="text-2xl">🚀</span> Trending Companies
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Most active hiring companies this month
          </p>
        </div>
        <Link
          href="/companies"
          className="text-xs font-extrabold text-blue-600 hover:text-blue-800 hover:underline"
        >
          View All Companies →
        </Link>
      </div>

      {/* Company Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {companies.map((company) => (
          <Link
            key={company.id}
            href={`/companies/${company.slug}`}
            className="group flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm hover:shadow-lg hover:border-blue-300 transition-all duration-300 hover:-translate-y-0.5"
          >
            <CompanyLogo name={company.name} logoUrl={company.logo_url} />

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                  {company.name}
                </span>
                {company.verified && (
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                )}
              </div>

              {company.industry && (
                <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                  {company.industry}
                </p>
              )}

              <div className="flex items-center gap-1 mt-1.5">
                <Briefcase className="w-3 h-3 text-emerald-500 shrink-0" />
                <span className="text-[11px] font-bold text-emerald-600">
                  {company.job_count} open role{company.job_count !== 1 ? "s" : ""}
                </span>
              </div>

              {company.remote_policy && (
                <span className="mt-1 inline-block text-[10px] font-semibold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded-md">
                  {company.remote_policy}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
