"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { getApiUrl } from "@/lib/api";

interface ApplicationJob {
  id: string;
  slug: string;
  title: string;
  company: string;
  location: string;
  apply_url?: string;
}

interface Application {
  id: string;
  job_id: string;
  status: string;
  priority: string;
  source: string;
  applied_at: string | null;
  updated_at: string | null;
  job: ApplicationJob;
}

const KANBAN_COLUMNS: { id: string; label: string; color: string; bg: string; border: string }[] = [
  { id: "Saved", label: "Saved", color: "text-slate-600", bg: "bg-slate-50", border: "border-slate-200" },
  { id: "Applied", label: "Applied", color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" },
  { id: "Viewed", label: "Viewed", color: "text-purple-700", bg: "bg-purple-50", border: "border-purple-200" },
  { id: "Interview", label: "Interview", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
  { id: "Offer", label: "Offer", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  { id: "Rejected", label: "Rejected", color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200" },
];

const PRIORITY_COLORS: Record<string, string> = {
  High: "bg-rose-100 text-rose-700",
  Medium: "bg-amber-100 text-amber-700",
  Low: "bg-slate-100 text-slate-600",
};

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export default function TrackerPage() {
  const router = useRouter();
  const { user, token, loading } = useAuth();

  const [applications, setApplications] = useState<Application[]>([]);
  const [fetching, setFetching] = useState(true);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Auth guard
  useEffect(() => {
    if (!loading && (!user || !token)) {
      router.replace("/");
    }
  }, [user, token, loading, router]);

  const fetchApplications = useCallback(async () => {
    if (!token) return;
    setFetching(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/applications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setApplications(data.applications || data || []);
      }
    } catch (e) {
      console.warn("Applications fetch error:", e);
    } finally {
      setFetching(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) fetchApplications();
  }, [token, fetchApplications]);

  const updateStatus = async (appId: string, newStatus: string) => {
    if (!token) return;
    setUpdatingId(appId);
    try {
      const res = await fetch(`${getApiUrl()}/api/applications/${appId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setApplications((prev) =>
          prev.map((a) => (a.id === appId ? { ...a, status: newStatus } : a))
        );
        setToast({ text: `Moved to ${newStatus}`, type: "success" });
      } else {
        setToast({ text: "Failed to update status", type: "error" });
      }
    } catch {
      setToast({ text: "Network error", type: "error" });
    } finally {
      setUpdatingId(null);
      setTimeout(() => setToast(null), 2500);
    }
  };

  const handleDragStart = (e: React.DragEvent, appId: string) => {
    setDraggedId(appId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    if (draggedId) {
      const app = applications.find((a) => a.id === draggedId);
      if (app && app.status !== columnId) {
        updateStatus(draggedId, columnId);
      }
    }
    setDraggedId(null);
  };

  const appsByStatus = (status: string) =>
    applications.filter((a) => a.status === status);

  const totalActive = applications.filter(
    (a) => !["Rejected", "Archived"].includes(a.status)
  ).length;

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl text-sm font-bold transition-all ${
            toast.type === "success"
              ? "bg-emerald-600 text-white"
              : "bg-rose-600 text-white"
          }`}
        >
          {toast.text}
        </div>
      )}

      {/* Header */}
      <div className="border-b border-slate-200 bg-white sticky top-0 z-30">
        <div className="mx-auto max-w-full px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-extrabold text-slate-900">Job Tracker</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {totalActive} active application{totalActive !== 1 ? "s" : ""} · Drag cards between columns to update status
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/jobs"
              className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition"
            >
              + Browse Jobs
            </Link>
            <Link
              href="/dashboard"
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              ← Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="p-4 sm:p-6 overflow-x-auto">
        {fetching ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin h-8 w-8 rounded-full border-4 border-blue-600 border-t-transparent" />
          </div>
        ) : (
          <div className="flex gap-4" style={{ minWidth: "900px" }}>
            {KANBAN_COLUMNS.map((col) => {
              const colApps = appsByStatus(col.id);
              return (
                <div
                  key={col.id}
                  className="flex-1 flex flex-col min-w-[200px]"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, col.id)}
                >
                  {/* Column Header */}
                  <div className={`rounded-2xl ${col.bg} border ${col.border} px-4 py-3 mb-3 flex items-center justify-between`}>
                    <span className={`text-xs font-extrabold uppercase tracking-wider ${col.color}`}>
                      {col.label}
                    </span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${col.bg} ${col.color} ${col.border}`}>
                      {colApps.length}
                    </span>
                  </div>

                  {/* Cards */}
                  <div className="flex-1 space-y-3 min-h-[200px]">
                    {colApps.length === 0 && (
                      <div className="rounded-2xl border-2 border-dashed border-slate-200 p-6 text-center">
                        <p className="text-xs text-slate-400 font-medium">Drop here</p>
                      </div>
                    )}
                    {colApps.map((app) => (
                      <div
                        key={app.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, app.id)}
                        className={`bg-white rounded-2xl border border-slate-200 p-4 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-all select-none ${
                          updatingId === app.id ? "opacity-50" : ""
                        } ${draggedId === app.id ? "opacity-40 scale-95" : ""}`}
                      >
                        {/* Company & Job */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">{app.job.company}</p>
                            <p className="text-[11px] text-slate-500 truncate">{app.job.title}</p>
                          </div>
                          <span className={`flex-shrink-0 px-1.5 py-0.5 rounded-lg text-[10px] font-bold ${PRIORITY_COLORS[app.priority] || PRIORITY_COLORS.Medium}`}>
                            {app.priority}
                          </span>
                        </div>

                        {/* Location */}
                        <p className="text-[11px] text-slate-400 mb-3 truncate">
                          📍 {app.job.location}
                        </p>

                        {/* Meta */}
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span>{timeAgo(app.applied_at)}</span>
                          <Link
                            href={`/jobs/${app.job.slug}`}
                            className="text-blue-600 hover:underline font-semibold"
                            onClick={(e) => e.stopPropagation()}
                          >
                            View →
                          </Link>
                        </div>

                        {/* Quick Status Move */}
                        <div className="mt-3 pt-3 border-t border-slate-100">
                          <select
                            value={app.status}
                            onChange={(e) => updateStatus(app.id, e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full text-[10px] font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 outline-none cursor-pointer"
                          >
                            {KANBAN_COLUMNS.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Empty State */}
      {!fetching && applications.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-5xl mb-4">📋</p>
          <h2 className="text-lg font-bold text-slate-900 mb-2">No applications yet</h2>
          <p className="text-sm text-slate-500 mb-6 max-w-xs">
            Start applying to jobs. Your applications will appear here as Kanban cards you can drag between stages.
          </p>
          <Link
            href="/jobs"
            className="rounded-2xl bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-700 transition"
          >
            Browse Jobs
          </Link>
        </div>
      )}
    </main>
  );
}
