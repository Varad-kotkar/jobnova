"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { getApiUrl } from "@/lib/api";
import { UserCheck, CheckCircle2, XCircle, RefreshCw } from "lucide-react";

export default function AdminRecruitersPage() {
  const { token } = useAuth();
  const [recruiters, setRecruiters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecruiters = async () => {
    setLoading(true);
    const apiBase = getApiUrl();
    try {
      const res = await fetch(`${apiBase}/api/admin/recruiters`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setRecruiters(json.data || []);
      }
    } catch (err) {
      console.warn("Recruiters fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchRecruiters();
  }, [token]);

  const handleStatusUpdate = async (recruiterId: string, newStatus: string) => {
    const apiBase = getApiUrl();
    try {
      const res = await fetch(`${apiBase}/api/admin/recruiters/${recruiterId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchRecruiters();
      }
    } catch (err) {
      console.warn("Update status error:", err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Recruiter Verification Queue</h1>
          <p className="text-xs text-slate-400">Review and approve employer recruiter accounts</p>
        </div>

        <button
          onClick={fetchRecruiters}
          className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        {recruiters.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="p-3">Recruiter Name</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Company</th>
                  <th className="p-3">Title</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {recruiters.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/40">
                    <td className="p-3 font-semibold text-white">{r.full_name}</td>
                    <td className="p-3 text-slate-400">{r.email}</td>
                    <td className="p-3 font-semibold text-sky-400">{r.company_name}</td>
                    <td className="p-3 text-slate-400">{r.job_title || "Recruiter"}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.verification_status === "approved"
                            ? "bg-emerald-950 text-emerald-400"
                            : r.verification_status === "rejected"
                            ? "bg-rose-950 text-rose-400"
                            : "bg-amber-950 text-amber-400"
                        }`}
                      >
                        {r.verification_status}
                      </span>
                    </td>
                    <td className="p-3 flex gap-2">
                      {r.verification_status !== "approved" && (
                        <button
                          onClick={() => handleStatusUpdate(r.id, "approved")}
                          className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-500 transition"
                        >
                          Approve
                        </button>
                      )}
                      {r.verification_status !== "rejected" && (
                        <button
                          onClick={() => handleStatusUpdate(r.id, "rejected")}
                          className="rounded-lg bg-rose-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-rose-500 transition"
                        >
                          Reject
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-slate-500 py-6 text-center">No pending or registered recruiters found in verification queue.</p>
        )}
      </div>
    </div>
  );
}
