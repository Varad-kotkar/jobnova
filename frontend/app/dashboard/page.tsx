"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import {
  getSavedJobs,
  getAppliedJobs,
  getUserProfile,
  toggleSaveJob,
  SavedJobItem,
  AppliedJobItem,
  UserProfileData,
} from "@/lib/storage";

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<"overview" | "saved" | "applied" | "profile">(
    (searchParams.get("tab") as any) || "overview"
  );
  const [savedJobs, setSavedJobs] = useState<SavedJobItem[]>([]);
  const [appliedJobs, setAppliedJobs] = useState<AppliedJobItem[]>([]);
  const [profile, setProfile] = useState<UserProfileData>(getUserProfile());

  useEffect(() => {
    setSavedJobs(getSavedJobs());
    setAppliedJobs(getAppliedJobs());
    setProfile(getUserProfile());
  }, []);

  const handleUnsave = (id: string, slug: string, title: string, company: string, location: string, remote: boolean) => {
    toggleSaveJob({ id, slug, title, company, location, remote });
    setSavedJobs(getSavedJobs());
  };

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "saved", label: `Saved Jobs (${savedJobs.length})` },
    { id: "applied", label: `Applied (${appliedJobs.length})` },
    { id: "profile", label: "Profile & Resume" },
  ];

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-950">
            Candidate Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Welcome back, <span className="font-semibold text-slate-950">{user?.displayName || profile.name}</span>. Manage your saved listings, applications, and profile.
          </p>
        </div>
        <Link
          href="/jobs"
          className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-slate-800 transition"
        >
          Explore New Jobs →
        </Link>
      </div>

      {/* Metrics Cards Grid (Linear/Notion style) */}
      <div className="mb-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-card">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Applications Sent</p>
          <p className="mt-2 text-3xl font-extrabold text-slate-950">{appliedJobs.length}</p>
          <p className="mt-1 text-xs text-slate-500">Tracked in application history</p>
        </div>

        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-card">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Saved Jobs</p>
          <p className="mt-2 text-3xl font-extrabold text-slate-950">{savedJobs.length}</p>
          <p className="mt-1 text-xs text-slate-500">Bookmarked for quick review</p>
        </div>

        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-card">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Interviews</p>
          <p className="mt-2 text-3xl font-extrabold text-slate-950">
            {appliedJobs.filter((j) => j.status === "Interview").length}
          </p>
          <p className="mt-1 text-xs text-slate-500">Active interview pipelines</p>
        </div>

        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-card">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Profile Completion</p>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-3xl font-extrabold text-slate-950">{profile.completionPercentage}%</span>
            <span className="text-xs font-semibold text-emerald-600">Strong</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full bg-slate-950 transition-all duration-500"
              style={{ width: `${profile.completionPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="mb-6 flex border-b border-slate-200">
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                router.replace(`/dashboard?tab=${tab.id}`, { scroll: false });
              }}
              className={`border-b-2 px-4 py-3 text-sm font-semibold transition ${
                activeTab === tab.id
                  ? "border-slate-950 text-slate-950"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Recent Saved Jobs */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-950">Recent Saved Jobs</h2>
              <button
                onClick={() => setActiveTab("saved")}
                className="text-xs font-semibold text-indigo-600 hover:underline"
              >
                View all ({savedJobs.length})
              </button>
            </div>

            {savedJobs.length > 0 ? (
              <div className="space-y-3">
                {savedJobs.slice(0, 4).map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-card hover:border-slate-300 transition"
                  >
                    <div>
                      <Link href={`/jobs/${job.slug}`} className="font-bold text-slate-950 hover:text-indigo-600 transition">
                        {job.title}
                      </Link>
                      <p className="text-xs text-slate-500">{job.company} • {job.location}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/jobs/${job.slug}`}
                        className="rounded-xl bg-slate-950 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition"
                      >
                        View Role
                      </Link>
                      <button
                        onClick={() => handleUnsave(job.id, job.slug, job.title, job.company, job.location, job.remote)}
                        className="text-xs font-medium text-red-500 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
                <p className="text-sm font-semibold text-slate-700">No saved jobs yet</p>
                <p className="text-xs text-slate-400 mt-1">Bookmark listings while browsing to review them later.</p>
                <Link href="/jobs" className="mt-4 inline-block rounded-xl bg-slate-950 px-4 py-2 text-xs font-semibold text-white">
                  Browse Jobs
                </Link>
              </div>
            )}
          </div>

          {/* Quick Profile Summary */}
          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card space-y-4">
              <h2 className="text-lg font-bold text-slate-950">Candidate Profile</h2>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-400">Name:</span>
                  <span className="font-semibold text-slate-900 ml-2">{profile.name}</span>
                </div>
                <div>
                  <span className="text-slate-400">Headline:</span>
                  <span className="font-medium text-slate-700 block mt-0.5">{profile.headline}</span>
                </div>
                <div>
                  <span className="text-slate-400">Location:</span>
                  <span className="font-semibold text-slate-900 ml-2">{profile.location}</span>
                </div>
                <div>
                  <span className="text-slate-400">Resume:</span>
                  <span className="font-semibold text-slate-900 ml-2">{profile.resumeFileName}</span>
                </div>
              </div>
              <Link
                href="/profile"
                className="block text-center rounded-xl border border-slate-200 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Edit Full Profile →
              </Link>
            </div>
          </div>
        </div>
      )}

      {activeTab === "saved" && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-950">Saved Jobs</h2>
          {savedJobs.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {savedJobs.map((job) => (
                <div key={job.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-950">{job.title}</h3>
                    <p className="text-xs text-slate-500 mt-1">{job.company} • {job.location}</p>
                  </div>
                  <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                    <Link href={`/jobs/${job.slug}`} className="text-xs font-semibold text-indigo-600 hover:underline">
                      View Job →
                    </Link>
                    <button
                      onClick={() => handleUnsave(job.id, job.slug, job.title, job.company, job.location, job.remote)}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <p className="text-base font-semibold text-slate-700">No saved jobs</p>
              <p className="text-xs text-slate-400 mt-1">When you bookmark jobs, they will be listed here.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "applied" && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-950">Application History</h2>
          {appliedJobs.length > 0 ? (
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-card">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5">Role</th>
                    <th className="px-6 py-3.5">Company</th>
                    <th className="px-6 py-3.5">Applied Date</th>
                    <th className="px-6 py-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {appliedJobs.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 font-bold text-slate-950">
                        <Link href={`/jobs/${item.slug}`} className="hover:text-indigo-600">
                          {item.title}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{item.company}</td>
                      <td className="px-6 py-4 text-slate-400">{new Date(item.appliedAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700 border border-emerald-100">
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <p className="text-base font-semibold text-slate-700">No applications recorded yet</p>
              <p className="text-xs text-slate-400 mt-1">Jobs you click 'Apply Now' on will automatically appear in your tracker.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "profile" && (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-card space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-slate-950">Candidate Profile & Resume</h2>
              <p className="text-xs text-slate-500">Manage your profile details and skills.</p>
            </div>
            <Link href="/profile" className="rounded-xl bg-slate-950 px-4 py-2 text-xs font-semibold text-white">
              Open Full Profile Editor →
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
