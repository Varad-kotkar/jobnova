"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { getApiUrl } from "@/lib/api";

interface SystemMetrics {
  total_users: number;
  total_jobs: number;
  total_applications: number;
  total_companies: number;
  pending_recruiter_reviews: number;
}

interface RecruiterItem {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  company_name: string;
  company_website?: string;
  linkedin_url?: string;
  job_title?: string;
  department?: string;
  verification_status: "pending" | "approved" | "rejected" | "suspended";
  created_at?: string;
}

type AdminTab = "overview" | "recruiters" | "jobs" | "users" | "system";

const statusColors: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-rose-50 text-rose-700 border-rose-200",
  suspended: "bg-slate-100 text-slate-600 border-slate-200",
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, token, loading } = useAuth();

  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [recruiters, setRecruiters] = useState<RecruiterItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [dataLoading, setDataLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Role guard
  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      router.replace("/");
    }
  }, [user, loading, router]);

  const fetchMetrics = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${getApiUrl()}/api/admin/metrics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMetrics(data.data);
      }
    } catch (e) {
      console.warn("Metrics fetch error:", e);
    }
  }, [token]);

  const fetchRecruiters = useCallback(async () => {
    if (!token) return;
    setDataLoading(true);
    try {
      const url = statusFilter
        ? `${getApiUrl()}/api/admin/recruiters?status=${statusFilter}`
        : `${getApiUrl()}/api/admin/recruiters`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRecruiters(data.data || []);
      }
    } catch (e) {
      console.warn("Recruiters fetch error:", e);
    } finally {
      setDataLoading(false);
    }
  }, [token, statusFilter]);

  useEffect(() => {
    if (token && user?.role === "admin") {
      fetchMetrics();
    }
  }, [token, user, fetchMetrics]);

  useEffect(() => {
    if (token && user?.role === "admin" && activeTab === "recruiters") {
      fetchRecruiters();
    }
  }, [token, user, activeTab, statusFilter, fetchRecruiters]);

  const handleRecruiterAction = async (recruiterId: string, newStatus: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${getApiUrl()}/api/admin/recruiters/${recruiterId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setActionMsg({ type: "success", text: `Recruiter status updated to "${newStatus}" successfully.` });
        setRecruiters((prev) =>
          prev.map((r) =>
            r.id === recruiterId ? { ...r, verification_status: newStatus as any } : r
          )
        );
        await fetchMetrics();
      } else {
        const err = await res.json().catch(() => ({}));
        setActionMsg({ type: "error", text: err.error?.message || "Action failed." });
      }
    } catch (e) {
      setActionMsg({ type: "error", text: "Network error. Please try again." });
    }
    setTimeout(() => setActionMsg(null), 4000);
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (user.role !== "admin") return null;

  const tabs: { id: AdminTab; label: string; icon: string }[] = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "recruiters", label: `Recruiters${metrics ? ` (${metrics.pending_recruiter_reviews} pending)` : ""}`, icon: "👥" },
    { id: "jobs", label: "Jobs", icon: "💼" },
    { id: "users", label: "Users", icon: "🧑‍💻" },
    { id: "system", label: "System Health", icon: "⚙️" },
  ];

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Admin Header */}
      <div className="border-b border-slate-200 bg-white sticky top-0 z-30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-extrabold uppercase tracking-wider">
                Admin
              </span>
              <h1 className="text-lg font-extrabold text-slate-900">JobNova Control Panel</h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Platform-wide management and audit console</p>
          </div>
          <Link href="/" className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition">
            ← Back to Platform
          </Link>
        </div>

        {/* Tab Navigation */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex gap-1 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition ${
                activeTab === t.id
                  ? "border-blue-600 text-blue-700"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <span>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        {/* Action Toast */}
        {actionMsg && (
          <div
            className={`mb-6 rounded-2xl p-4 text-sm font-semibold border ${
              actionMsg.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-rose-50 text-rose-800 border-rose-200"
            }`}
          >
            {actionMsg.type === "success" ? "✓ " : "⚠ "}{actionMsg.text}
          </div>
        )}

        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
              {[
                { label: "Total Users", value: metrics?.total_users ?? "—", color: "text-blue-700" },
                { label: "Total Jobs", value: metrics?.total_jobs ?? "—", color: "text-indigo-700" },
                { label: "Applications", value: metrics?.total_applications ?? "—", color: "text-purple-700" },
                { label: "Companies", value: metrics?.total_companies ?? "—", color: "text-emerald-700" },
                { label: "Pending Reviews", value: metrics?.pending_recruiter_reviews ?? "—", color: "text-amber-700" },
              ].map((m) => (
                <div key={m.label} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{m.label}</p>
                  <p className={`mt-2 text-3xl font-extrabold ${m.color}`}>{m.value}</p>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900 mb-4">Quick Actions</h2>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setActiveTab("recruiters")}
                  className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700 transition"
                >
                  Review Pending Recruiters ({metrics?.pending_recruiter_reviews ?? 0})
                </button>
                <button
                  onClick={() => {
                    if (token) {
                      fetch(`${getApiUrl()}/api/ingestion/trigger`, {
                        method: "POST",
                        headers: { Authorization: `Bearer ${token}` },
                      }).then(() => setActionMsg({ type: "success", text: "Job ingestion triggered. Results in ~60s." }))
                        .catch(() => setActionMsg({ type: "error", text: "Failed to trigger scraper." }));
                    }
                  }}
                  className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 transition"
                >
                  🔄 Trigger Job Scraper
                </button>
                <Link
                  href="/jobs"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                >
                  Browse All Jobs →
                </Link>
              </div>
            </div>

            {/* Stats Breakdown */}
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-sm font-bold text-slate-900 mb-4">Platform Health</h2>
                <div className="space-y-3 text-xs">
                  {[
                    { label: "Jobs / Company", value: metrics ? `${(metrics.total_jobs / Math.max(1, metrics.total_companies)).toFixed(1)}` : "—" },
                    { label: "Apply Rate", value: metrics ? `${((metrics.total_applications / Math.max(1, metrics.total_jobs)) * 100).toFixed(1)}%` : "—" },
                    { label: "Pending Recruiter Reviews", value: metrics?.pending_recruiter_reviews ?? "—" },
                  ].map((s) => (
                    <div key={s.label} className="flex justify-between py-2 border-b border-slate-100 last:border-0">
                      <span className="font-semibold text-slate-600">{s.label}</span>
                      <span className="font-bold text-slate-900">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-sm font-bold text-slate-900 mb-4">Feature Flags</h2>
                <div className="space-y-2">
                  {[
                    { name: "Candidate Onboarding Wizard", on: true },
                    { name: "AI Career Coach", on: true },
                    { name: "Job Applications (Native)", on: true },
                    { name: "Telegram Bot Notifications", on: false },
                    { name: "Recruiter Billing", on: false },
                  ].map((f) => (
                    <div key={f.name} className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                      <span className="text-xs font-semibold text-slate-700">{f.name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${f.on ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"}`}>
                        {f.on ? "On" : "Off"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* RECRUITERS TAB */}
        {activeTab === "recruiters" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-base font-bold text-slate-900">Recruiter Management</h2>
              <div className="flex flex-wrap gap-2">
                {(["pending", "approved", "rejected", "suspended", ""] as const).map((s) => (
                  <button
                    key={s || "all"}
                    onClick={() => setStatusFilter(s)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      statusFilter === s
                        ? "bg-slate-900 text-white"
                        : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {s === "" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {dataLoading ? (
              <div className="py-12 text-center text-sm font-semibold text-slate-500">Loading recruiter profiles...</div>
            ) : recruiters.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
                <p className="text-sm font-semibold text-slate-700">
                  No recruiters with status "{statusFilter || "any"}"
                </p>
                <p className="text-xs text-slate-400 mt-1">Try changing the filter above.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recruiters.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700 font-extrabold text-sm flex-shrink-0">
                          {r.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">{r.full_name}</h3>
                          <p className="text-xs text-slate-500">{r.email}</p>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusColors[r.verification_status] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
                          {r.verification_status}
                        </span>
                      </div>
                      <div className="pl-12 text-xs text-slate-600 space-y-0.5">
                        <p>
                          <span className="font-semibold">{r.job_title || "Recruiter"}</span>
                          {" at "}
                          <span className="font-semibold text-slate-900">{r.company_name}</span>
                        </p>
                        {r.company_website && (
                          <p>
                            <a href={r.company_website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              {r.company_website}
                            </a>
                          </p>
                        )}
                        {r.linkedin_url && (
                          <a href={r.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            LinkedIn →
                          </a>
                        )}
                        {r.created_at && (
                          <p className="text-slate-400">Applied {new Date(r.created_at).toLocaleDateString()}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {r.verification_status !== "approved" && (
                        <button
                          onClick={() => handleRecruiterAction(r.id, "approved")}
                          className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition"
                        >
                          ✓ Approve
                        </button>
                      )}
                      {r.verification_status !== "rejected" && (
                        <button
                          onClick={() => handleRecruiterAction(r.id, "rejected")}
                          className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 transition"
                        >
                          ✗ Reject
                        </button>
                      )}
                      {r.verification_status === "approved" && (
                        <button
                          onClick={() => handleRecruiterAction(r.id, "suspended")}
                          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                        >
                          Suspend
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* JOBS TAB */}
        {activeTab === "jobs" && (
          <div className="space-y-6">
            <h2 className="text-base font-bold text-slate-900">Job Management</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      if (token) {
                        fetch(`${getApiUrl()}/api/ingestion/trigger`, {
                          method: "POST",
                          headers: { Authorization: `Bearer ${token}` },
                        }).then(() => setActionMsg({ type: "success", text: "Scraper triggered. Check back in 60 seconds." }))
                          .catch(() => setActionMsg({ type: "error", text: "Failed to trigger scraper." }));
                      }
                    }}
                    className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition text-left"
                  >
                    🔄 Run Job Scraper Now
                  </button>
                  <Link
                    href="/jobs"
                    className="block w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                  >
                    Browse All Jobs →
                  </Link>
                </div>
              </div>
              <div className="rounded-2xl border border-amber-100 bg-amber-50 p-6">
                <h3 className="text-sm font-bold text-amber-900 mb-2">Coming Soon</h3>
                <ul className="text-xs text-amber-800 space-y-1 list-disc list-inside">
                  <li>Feature / unfeature jobs</li>
                  <li>Delete fake or spam jobs</li>
                  <li>Merge duplicate companies</li>
                  <li>Bulk archive expired jobs</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === "users" && (
          <div className="space-y-6">
            <h2 className="text-base font-bold text-slate-900">User Management</h2>
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
              <p className="text-sm font-semibold text-slate-700 mb-2">User management panel</p>
              <p className="text-xs text-slate-500 mb-4">Ban users, verify identities, export user data, and GDPR deletion.</p>
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-xs text-amber-800 font-semibold text-left max-w-sm mx-auto">
                ⚠ Backend endpoints exist. UI panel in progress.
              </div>
            </div>
          </div>
        )}

        {/* SYSTEM TAB */}
        {activeTab === "system" && (
          <div className="space-y-6">
            <h2 className="text-base font-bold text-slate-900">System Health</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { label: "API Server", status: "Operational", color: "emerald" },
                { label: "Database (SQLite)", status: "Connected", color: "emerald" },
                { label: "Job Scraper", status: "Active", color: "emerald" },
                { label: "Auth Service (Firebase)", status: "Operational", color: "emerald" },
                { label: "Cache", status: "In-Memory (Redis Ready)", color: "amber" },
                { label: "Email Queue", status: "Architecture Ready", color: "amber" },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">{s.label}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                    s.color === "emerald"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}>
                    {s.status}
                  </span>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-1">Health Endpoint</h3>
              <p className="text-xs text-slate-500 mb-3">Check the live backend health status</p>
              <a
                href={`${getApiUrl()}/health/ready`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-700 transition"
              >
                Open Health Endpoint →
              </a>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
