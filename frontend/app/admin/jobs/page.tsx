"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { getApiUrl } from "@/lib/api";
import { Briefcase, Trash2, RefreshCw } from "lucide-react";

export default function AdminJobsPage() {
  const { token } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = async () => {
    setLoading(true);
    const apiBase = getApiUrl();
    try {
      const res = await fetch(`${apiBase}/api/jobs?page=1&page_size=30`);
      if (res.ok) {
        const json = await res.json();
        setJobs(json.items || []);
      }
    } catch (err) {
      console.warn("Jobs fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm("Are you sure you want to delete this job listing?")) return;
    const apiBase = getApiUrl();
    try {
      const res = await fetch(`${apiBase}/api/admin/jobs/${jobId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchJobs();
      }
    } catch (err) {
      console.warn("Delete job error:", err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Job Moderation</h1>
          <p className="text-xs text-slate-400">View and remove live job listings across the platform</p>
        </div>

        <button
          onClick={fetchJobs}
          className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        {jobs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="p-3">Job Title</th>
                  <th className="p-3">Company</th>
                  <th className="p-3">Location</th>
                  <th className="p-3">Posted Date</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {jobs.map((j) => (
                  <tr key={j.id} className="hover:bg-slate-800/40">
                    <td className="p-3 font-semibold text-white">{j.title}</td>
                    <td className="p-3 text-sky-400 font-semibold">{j.company}</td>
                    <td className="p-3 text-slate-400">{j.location}</td>
                    <td className="p-3 text-slate-400">{new Date(j.published_at).toLocaleDateString()}</td>
                    <td className="p-3">
                      <button
                        onClick={() => handleDeleteJob(j.id)}
                        className="flex items-center gap-1 rounded-lg bg-rose-950 border border-rose-800 px-2.5 py-1 text-[11px] font-bold text-rose-400 hover:bg-rose-900 hover:text-white transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-slate-500 py-6 text-center">No active job listings found.</p>
        )}
      </div>
    </div>
  );
}
