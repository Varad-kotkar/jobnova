"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { getApiUrl } from "@/lib/api";
import { Users, Briefcase, FileText, Building2, UserCheck, Activity, RefreshCw } from "lucide-react";

interface AdminMetrics {
  total_users: number;
  total_jobs: number;
  total_applications: number;
  total_companies: number;
  pending_recruiter_reviews: number;
}

export default function AdminDashboardPage() {
  const { token } = useAuth();
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    setLoading(true);
    const apiBase = getApiUrl();
    try {
      const res = await fetch(`${apiBase}/api/admin/metrics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setMetrics(json.data);
      }
    } catch (err) {
      console.warn("Metrics fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchMetrics();
    }
  }, [token]);

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Enterprise Overview</h1>
          <p className="text-xs text-slate-400">Live platform telemetry, candidate metrics, and system activity</p>
        </div>

        <button
          onClick={fetchMetrics}
          className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:border-slate-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh Metrics
        </button>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Users</span>
            <Users className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-3xl font-black text-white">{metrics?.total_users ?? 0}</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Active Jobs</span>
            <Briefcase className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-3xl font-black text-emerald-400">{metrics?.total_jobs ?? 0}</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Applications</span>
            <FileText className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-3xl font-black text-purple-400">{metrics?.total_applications ?? 0}</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Pending Recruiters</span>
            <UserCheck className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-3xl font-black text-amber-400">{metrics?.pending_recruiter_reviews ?? 0}</p>
        </div>
      </div>

      {/* System Status Banner */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" /> Infrastructure Status
        </h2>
        <div className="grid gap-4 sm:grid-cols-3 text-xs text-slate-300">
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="text-slate-500 block">FastAPI Backend</span>
            <strong className="text-emerald-400">v1.1 Healthy</strong>
          </div>
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="text-slate-500 block">Database Pool</span>
            <strong className="text-emerald-400">Connected</strong>
          </div>
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="text-slate-500 block">Scraper Pipeline</span>
            <strong className="text-emerald-400">1-Hour Refresh Loop Active</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
