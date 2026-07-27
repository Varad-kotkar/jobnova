"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { getApiUrl } from "@/lib/api";
import { Send, CheckCircle2, AlertCircle, RefreshCw, Radio } from "lucide-react";

interface TelegramSettingsData {
  is_configured: boolean;
  channel_id: string;
  bot_configured: boolean;
  recent_logs: Array<{
    job_id: string;
    job_title: string;
    channel: string;
    status_code: number;
    success: boolean;
    attempt: number;
  }>;
}

export default function AdminTelegramPage() {
  const { token } = useAuth();
  const [data, setData] = useState<TelegramSettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any | null>(null);

  const fetchSettings = async () => {
    setLoading(true);
    const apiBase = getApiUrl();
    try {
      const res = await fetch(`${apiBase}/api/admin/telegram/settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setData(json.data);
      }
    } catch (err) {
      console.warn("Telegram settings fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchSettings();
    }
  }, [token]);

  const handleTestPost = async () => {
    setTesting(true);
    setTestResult(null);
    const apiBase = getApiUrl();
    try {
      const res = await fetch(`${apiBase}/api/admin/telegram/test`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setTestResult(json.result);
      fetchSettings();
    } catch (err: any) {
      setTestResult({ success: false, error: err?.message });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Telegram Channel Integration</h1>
          <p className="text-xs text-slate-400">Manage automatic job broadcasting to Telegram channels and test bot status</p>
        </div>

        <button
          onClick={fetchSettings}
          className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:border-slate-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Status Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Telegram Channel Auto-Broadcast Engine</h3>
              <p className="text-xs text-slate-400">Channel ID: <span className="text-sky-400 font-semibold">{data?.channel_id || "@jobnova_jobs"}</span></p>
            </div>
          </div>

          <span
            className={`px-3 py-1 text-xs font-bold rounded-full ${
              data?.is_configured
                ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                : "bg-amber-950 text-amber-400 border border-amber-800"
            }`}
          >
            {data?.is_configured ? "Configured & Active ✅" : "Environment Setup Pending ⚠️"}
          </span>
        </div>

        {/* Test Button Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-950/80 p-4 rounded-xl border border-slate-800">
          <div>
            <h4 className="text-xs font-bold text-white">Broadcast Sample Test Message</h4>
            <p className="text-[11px] text-slate-400">Verifies TELEGRAM_BOT_TOKEN and channel admin permissions.</p>
          </div>

          <button
            onClick={handleTestPost}
            disabled={testing}
            className="flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-xs font-extrabold text-white shadow-md hover:bg-sky-500 transition shrink-0"
          >
            <Radio className="w-4 h-4" /> {testing ? "Broadcasting Test..." : "Test Telegram Post 🚀"}
          </button>
        </div>

        {/* Test Result Callout */}
        {testResult && (
          <div
            className={`rounded-xl border p-4 text-xs ${
              testResult.success
                ? "bg-emerald-950/60 border-emerald-800 text-emerald-300"
                : "bg-rose-950/60 border-rose-800 text-rose-300"
            }`}
          >
            <p className="font-bold flex items-center gap-2">
              {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
              {testResult.success ? "Test Message Successfully Posted to Telegram Channel!" : "Telegram Test Broadcast Failed"}
            </p>
            <p className="mt-1 text-[11px] opacity-90">{testResult.error || JSON.stringify(testResult.telegram_response || {})}</p>
          </div>
        )}
      </div>

      {/* Broadcast Log Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <h3 className="text-sm font-bold text-white">Recent Telegram Broadcast Logs</h3>
        {data?.recent_logs && data.recent_logs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="p-3">Job Title</th>
                  <th className="p-3">Channel</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Attempts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {data.recent_logs.map((log, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40">
                    <td className="p-3 font-semibold text-white">{log.job_title || log.job_id}</td>
                    <td className="p-3 text-slate-400">{log.channel}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${log.success ? "bg-emerald-950 text-emerald-400" : "bg-rose-950 text-rose-400"}`}>
                        {log.success ? "Success (200)" : `Failed (${log.status_code})`}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400">{log.attempt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-slate-500 py-4 text-center">No broadcast logs recorded yet. Create a job listing or run a test to populate logs.</p>
        )}
      </div>
    </div>
  );
}
