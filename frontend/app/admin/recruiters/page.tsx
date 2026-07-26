"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { getApiUrl } from "@/lib/api";
import { ShieldAlert, CheckCircle, XCircle, Clock, ExternalLink, Building2, UserCheck } from "lucide-react";

interface Recruiter {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  company_name: string;
  company_website?: string;
  linkedin_url?: string;
  job_title?: string;
  verification_status: "pending" | "approved" | "rejected" | "suspended";
  created_at?: string;
}

export default function AdminRecruitersPage() {
  const { token, user } = useAuth();
  const [recruiters, setRecruiters] = useState<Recruiter[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchRecruiters = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const apiBase = getApiUrl();
      const statusQuery = filterStatus !== "all" ? `?status=${filterStatus}` : "";
      const res = await fetch(`${apiBase}/api/admin/recruiters${statusQuery}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const body = await res.json();
        setRecruiters(body.data || []);
      }
    } catch (err) {
      console.error("Failed loading recruiter verification queue:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecruiters();
  }, [token, filterStatus]);

  const updateStatus = async (recruiterId: string, newStatus: string) => {
    if (!token) return;
    setActionLoading(recruiterId);
    try {
      const apiBase = getApiUrl();
      const res = await fetch(`${apiBase}/api/admin/recruiters/${recruiterId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        await fetchRecruiters();
      }
    } catch (err) {
      console.error("Status update error:", err);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <UserCheck className="w-8 h-8 text-blue-600" />
            Recruiter Verification Queue
          </h1>
          <p className="text-slate-600 mt-1">Review, approve, or suspend recruiter verification applications.</p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center bg-slate-100 p-1.5 rounded-xl text-xs font-semibold">
          {["all", "pending", "approved", "rejected", "suspended"].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                filterStatus === st ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-white rounded-2xl border border-slate-100 animate-pulse" />
          ))}
        </div>
      ) : recruiters.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">No Recruiters Found</h3>
          <p className="text-slate-500 text-sm mt-1">
            There are no recruiter accounts matching status "{filterStatus}".
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Recruiter & Company</th>
                  <th className="px-6 py-4">Title</th>
                  <th className="px-6 py-4">Links</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {recruiters.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{r.full_name}</div>
                      <div className="text-xs text-slate-500">{r.email}</div>
                      <div className="text-xs font-semibold text-blue-600 mt-0.5 flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {r.company_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{r.job_title || "Technical Recruiter"}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 text-xs">
                        {r.company_website && (
                          <a
                            href={r.company_website}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:underline flex items-center gap-0.5 font-medium"
                          >
                            Website <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        {r.linkedin_url && (
                          <a
                            href={r.linkedin_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:underline flex items-center gap-0.5 font-medium"
                          >
                            LinkedIn <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold capitalize ${
                          r.verification_status === "approved"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : r.verification_status === "pending"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                        }`}
                      >
                        {r.verification_status === "approved" && <CheckCircle className="w-3 h-3" />}
                        {r.verification_status === "pending" && <Clock className="w-3 h-3" />}
                        {r.verification_status === "rejected" && <XCircle className="w-3 h-3" />}
                        {r.verification_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {r.verification_status !== "approved" && (
                        <button
                          disabled={actionLoading === r.id}
                          onClick={() => updateStatus(r.id, "approved")}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all disabled:opacity-50"
                        >
                          Approve
                        </button>
                      )}
                      {r.verification_status !== "rejected" && (
                        <button
                          disabled={actionLoading === r.id}
                          onClick={() => updateStatus(r.id, "rejected")}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                        >
                          Reject
                        </button>
                      )}
                      {r.verification_status !== "suspended" && r.verification_status === "approved" && (
                        <button
                          disabled={actionLoading === r.id}
                          onClick={() => updateStatus(r.id, "suspended")}
                          className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                        >
                          Suspend
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
