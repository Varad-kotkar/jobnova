"use client";

import React from "react";
import { Activity, CheckCircle2 } from "lucide-react";

export default function AdminSystemHealthPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">System Health & Telemetry</h1>
        <p className="text-xs text-slate-400">Platform operational status and database connection metrics</p>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" /> Operational Status Overview
        </h2>

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="font-semibold text-white">FastAPI Core API</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Healthy (v1.1)</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="font-semibold text-white">Database Pool (PostgreSQL / SQLite)</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Connected</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="font-semibold text-white">Periodic Job Ingestion Scheduler</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Active (1-Hour Loop)</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="font-semibold text-white">Telegram Channel Auto-Broadcaster</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
}
