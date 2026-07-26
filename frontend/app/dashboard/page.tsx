"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { getApiUrl } from "@/lib/api";
import {
  getSavedJobs,
  getAppliedJobs,
  getUserProfile,
  toggleSaveJob,
  SavedJobItem,
  AppliedJobItem,
  UserProfileData,
} from "@/lib/storage";

interface DashboardStatsData {
  metrics: {
    total_applications: number;
    active_interviews: number;
    offers_received: number;
    saved_jobs_count: number;
    response_rate_percentage: number;
  };
  funnel: Record<string, number>;
  upcoming_interviews: Array<{
    application_id: string;
    job_id: string;
    title: string;
    company: string;
    status: string;
    interview_date?: string | null;
    notes?: string | null;
  }>;
  recent_applications: Array<{
    id: string;
    job_id: string;
    title: string;
    company: string;
    status: string;
    applied_at?: string | null;
  }>;
  saved_jobs: Array<{
    id: string;
    slug: string;
    title: string;
    company: string;
    location: string;
    remote: boolean;
    saved_at?: string | null;
  }>;
  profile_completeness: {
    percentage: number;
    missing_fields: string[];
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, token, loading } = useAuth();

  const [activeTab, setActiveTab] = useState<"overview" | "saved" | "applied" | "profile">(
    (searchParams.get("tab") as any) || "overview"
  );
  const [savedJobs, setSavedJobs] = useState<SavedJobItem[]>([]);
  const [appliedJobs, setAppliedJobs] = useState<AppliedJobItem[]>([]);
  const [profile, setProfile] = useState<UserProfileData>(getUserProfile());
  const [stats, setStats] = useState<DashboardStatsData | null>(null);

  // Auth guard — redirect unauthenticated users
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/?signin=1");
    }
  }, [user, loading, router]);

  useEffect(() => {
    setSavedJobs(getSavedJobs());
    setAppliedJobs(getAppliedJobs());
    setProfile(getUserProfile());

    // Fetch live dashboard stats from API if authenticated
    if (token) {
      const apiBase = getApiUrl();
      fetch(`${apiBase}/api/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) setStats(data);
        })
        .catch((err) => console.warn("Dashboard stats fetch warning:", err));
    }
  }, [token]);

  const handleUnsave = (id: string, slug: string, title: string, company: string, location: string, remote: boolean) => {
    toggleSaveJob({ id, slug, title, company, location, remote });
    setSavedJobs(getSavedJobs());
  };

  const totalAppsCount = stats ? stats.metrics.total_applications : appliedJobs.length;
  const savedJobsCount = stats ? stats.metrics.saved_jobs_count : savedJobs.length;
  const interviewsCount = stats ? stats.metrics.active_interviews : appliedJobs.filter((j) => j.status === "Interview").length;
  const responseRate = stats ? stats.metrics.response_rate_percentage : (appliedJobs.length > 0 ? 50 : 0);

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "saved", label: `Saved Jobs (${savedJobsCount})` },
    { id: "applied", label: `Applied (${totalAppsCount})` },
    { id: "profile", label: "Profile & Resume" },
  ];

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-950">
            Candidate Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Welcome back, <span className="font-semibold text-slate-950">{user?.full_name || profile.name}</span>. Manage your saved listings, applications, and profile.
          </p>
        </div>
        <Link
          href="/jobs"
          className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-slate-800 transition"
        >
          Explore New Jobs →
        </Link>
      </div>

      {/* Metrics Cards Grid */}
      <div className="mb-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-card">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Applications Sent</p>
          <p className="mt-2 text-3xl font-extrabold text-slate-950">{totalAppsCount}</p>
          <p className="mt-1 text-xs text-slate-500">Tracked in application history</p>
        </div>

        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-card">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Saved Jobs</p>
          <p className="mt-2 text-3xl font-extrabold text-slate-950">{savedJobsCount}</p>
          <p className="mt-1 text-xs text-slate-500">Bookmarked for quick review</p>
        </div>

        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-card">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Interviews</p>
          <p className="mt-2 text-3xl font-extrabold text-indigo-600">{interviewsCount}</p>
          <p className="mt-1 text-xs text-slate-500">Active interview pipelines</p>
        </div>

        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-card">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Response Rate</p>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-3xl font-extrabold text-emerald-600">{responseRate}%</span>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              {responseRate >= 30 ? "High" : "Average"}
            </span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${Math.min(100, responseRate)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="mb-8 border-b border-slate-200 flex gap-6 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`pb-4 text-sm font-bold transition border-b-2 whitespace-nowrap ${
              activeTab === t.id
                ? "border-slate-950 text-slate-950"
                : "border-transparent text-slate-400 hover:text-slate-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview Tab Content */}
      {activeTab === "overview" && (
        <div className="space-y-8">
          {/* Funnel Progress Section */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-card">
            <h2 className="text-lg font-bold text-slate-950 mb-4">Application Funnel Breakdown</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                <p className="text-2xl font-extrabold text-slate-950">{stats ? stats.funnel.Applied : appliedJobs.length}</p>
                <p className="text-xs font-semibold text-slate-500 mt-1">1. Applied</p>
              </div>
              <div className="rounded-2xl bg-indigo-50/50 p-4 border border-indigo-100">
                <p className="text-2xl font-extrabold text-indigo-700">{stats ? stats.funnel.Screening : 0}</p>
                <p className="text-xs font-semibold text-indigo-600 mt-1">2. Screening</p>
              </div>
              <div className="rounded-2xl bg-purple-50/50 p-4 border border-purple-100">
                <p className="text-2xl font-extrabold text-purple-700">{stats ? stats.funnel.Interview : 0}</p>
                <p className="text-xs font-semibold text-purple-600 mt-1">3. Interview</p>
              </div>
              <div className="rounded-2xl bg-emerald-50/50 p-4 border border-emerald-100">
                <p className="text-2xl font-extrabold text-emerald-700">{stats ? stats.funnel.Offer : 0}</p>
                <p className="text-xs font-semibold text-emerald-600 mt-1">4. Offer</p>
              </div>
            </div>
          </div>

          {/* Upcoming Interviews Schedule */}
          {stats && stats.upcoming_interviews.length > 0 && (
            <div className="rounded-3xl border border-indigo-200 bg-gradient-to-r from-indigo-50/80 to-purple-50/50 p-6 shadow-card">
              <h2 className="text-lg font-bold text-slate-950 mb-3">🗓️ Scheduled Interviews ({stats.upcoming_interviews.length})</h2>
              <div className="space-y-3">
                {stats.upcoming_interviews.map((item) => (
                  <div key={item.application_id} className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm">
                    <div>
                      <h3 className="text-sm font-bold text-slate-950">{item.title}</h3>
                      <p className="text-xs text-slate-500">{item.company} • Status: <span className="font-semibold text-indigo-600">{item.status}</span></p>
                    </div>
                    <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-800">
                      {item.interview_date ? new Date(item.interview_date).toLocaleDateString() : "Scheduled"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Saved Jobs Tab */}
      {activeTab === "saved" && (
        <div className="space-y-4">
          {savedJobs.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {savedJobs.map((item) => (
                <div key={item.id} className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
                  <div>
                    <h3 className="text-base font-bold text-slate-950 line-clamp-1">{item.title}</h3>
                    <p className="text-xs font-semibold text-slate-500 mt-1">{item.company}</p>
                    <p className="text-xs text-slate-400 mt-2">📍 {item.location} {item.remote && "• Remote"}</p>
                  </div>
                  <div className="mt-6 border-t border-slate-100 pt-4 flex items-center justify-between">
                    <button
                      onClick={() => handleUnsave(item.id, item.slug, item.title, item.company, item.location, item.remote)}
                      className="text-xs font-bold text-rose-600 hover:underline"
                    >
                      Remove
                    </button>
                    <Link
                      href={`/jobs/${item.slug}` as any}
                      className="rounded-xl bg-slate-950 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition"
                    >
                      View Role →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <p className="text-base font-semibold text-slate-700">No saved jobs yet</p>
              <p className="text-xs text-slate-400 mt-1">Bookmark roles from the job feed for quick reference.</p>
            </div>
          )}
        </div>
      )}

      {/* Applied Jobs Tab */}
      {activeTab === "applied" && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card space-y-4">
          <h2 className="text-lg font-bold text-slate-950">Application History</h2>
          {appliedJobs.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {appliedJobs.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-950">{item.title}</h3>
                    <p className="text-xs text-slate-500">{item.company} • Applied {new Date(item.appliedAt).toLocaleDateString()}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 py-4 text-center">No applications recorded yet.</p>
          )}
        </div>
      )}

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-card space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-950">{profile.name}</h2>
              <p className="text-xs text-slate-500">{profile.headline}</p>
            </div>
            <Link
              href="/profile"
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-800 shadow-card hover:bg-slate-50 transition"
            >
              Edit Profile Details →
            </Link>
          </div>

          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Core Tech Skills</h3>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((s) => (
                <span key={s} className="rounded-xl bg-slate-100 px-3 py-1 text-xs font-medium text-slate-800">
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
