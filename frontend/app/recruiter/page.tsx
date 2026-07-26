"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { getApiUrl } from "@/lib/api";

interface RecruiterApplicantItem {
  application_id: string;
  candidate_id: string;
  candidate_name: string;
  candidate_email: string;
  candidate_headline: string;
  job_id: string;
  job_title: string;
  company_name: string;
  status: string;
  priority: string;
  applied_at?: string | null;
  ai_match_score: number;
  ai_recommendation: string;
  matched_skills: string[];
  missing_skills: string[];
  resume: {
    id?: string | null;
    file_name?: string | null;
    version?: number | null;
  };
}

export default function RecruiterPortalPage() {
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState<"applicants" | "post">("applicants");
  const [applicants, setApplicants] = useState<RecruiterApplicantItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Post Job Form State
  const [title, setTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [location, setLocation] = useState("Remote");
  const [description, setDescription] = useState("");
  const [skillsStr, setSkillsStr] = useState("Python, FastAPI, React, PostgreSQL");
  const [postedNotice, setPostedNotice] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);

  const verificationStatus = user?.recruiter_profile?.verification_status || (user?.role === "admin" ? "approved" : "pending");
  const isApproved = user?.role === "admin" || verificationStatus === "approved";

  useEffect(() => {
    fetchApplicants();
  }, [token]);

  const fetchApplicants = () => {
    if (token) {
      const apiBase = getApiUrl();
      fetch(`${apiBase}/api/recruiter/applications`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => {
          if (Array.isArray(data)) setApplicants(data);
        })
        .catch((err) => console.warn("Recruiter applicants fetch error:", err))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  };

  const handleStatusChange = async (appId: string, newStatus: string) => {
    if (token) {
      const apiBase = getApiUrl();
      try {
        const res = await fetch(`${apiBase}/api/recruiter/applications/${appId}/status`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ new_status: newStatus, notes: `Updated by recruiter to ${newStatus}` }),
        });
        if (res.ok) {
          setApplicants((prev) =>
            prev.map((a) => (a.application_id === appId ? { ...a, status: newStatus } : a))
          );
        }
      } catch (err) {
        console.warn("Status update error:", err);
      }
    }
  };

  const handlePostJobSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPostError(null);
    if (!title.trim() || !companyName.trim() || !description.trim()) return;

    if (!isApproved) {
      setPostError(`Recruiter verification required. Current status: '${verificationStatus}'. Only approved recruiters may post jobs.`);
      return;
    }

    setPosting(true);
    if (token) {
      const apiBase = getApiUrl();
      try {
        const skillsList = skillsStr.split(",").map((s) => s.trim()).filter(Boolean);
        const res = await fetch(`${apiBase}/api/recruiter/jobs`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title,
            company_name: companyName,
            location,
            description,
            remote: true,
            skills: skillsList,
          }),
        });

        if (res.ok) {
          setPostedNotice(true);
          setTitle("");
          setDescription("");
          setTimeout(() => setPostedNotice(false), 4000);
        } else {
          const errData = await res.json().catch(() => ({}));
          setPostError(errData.detail || errData.error?.message || "Job posting rejected by backend policy.");
        }
      } catch (err) {
        console.warn("Job posting error:", err);
        setPostError("Failed to submit job posting. Check network connection.");
      } finally {
        setPosting(false);
      }
    } else {
      setPostError("Please sign in with a recruiter account to post jobs.");
      setPosting(false);
    }
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-950">
            Employer & Recruiter Portal 💼
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Post verified engineering roles, review applicant pipelines, and evaluate real-time AI Fit Scores.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-card hover:bg-slate-50 transition"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {/* Tabs Navigation */}
      <div className="mb-8 border-b border-slate-200 flex gap-6">
        <button
          onClick={() => setActiveTab("applicants")}
          className={`pb-4 text-sm font-bold transition border-b-2 ${
            activeTab === "applicants"
              ? "border-slate-950 text-slate-950"
              : "border-transparent text-slate-400 hover:text-slate-700"
          }`}
        >
          Applicant Pipeline ({applicants.length})
        </button>
        <button
          onClick={() => setActiveTab("post")}
          className={`pb-4 text-sm font-bold transition border-b-2 ${
            activeTab === "post"
              ? "border-slate-950 text-slate-950"
              : "border-transparent text-slate-400 hover:text-slate-700"
          }`}
        >
          Post New Role ➕
        </button>
      </div>

      {/* Applicant Pipeline Tab */}
      {activeTab === "applicants" && (
        <div className="space-y-6">
          {loading ? (
            <div className="py-12 text-center text-sm font-semibold text-slate-600">
              Loading applicant pipelines and calculating candidate AI Fit Scores...
            </div>
          ) : applicants.length > 0 ? (
            <div className="grid gap-4">
              {applicants.map((app) => (
                <div
                  key={app.application_id}
                  className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-base font-bold text-slate-950">{app.candidate_name}</h3>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-extrabold border ${
                          app.ai_match_score >= 80
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        ⚡ {app.ai_match_score}% Match ({app.ai_recommendation})
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{app.candidate_headline} • {app.candidate_email}</p>
                    <p className="text-xs font-semibold text-indigo-600">
                      Applied for: {app.job_title} at {app.company_name}
                    </p>
                    {app.matched_skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {app.matched_skills.map((sk) => (
                          <span key={sk} className="rounded-lg bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                            {sk}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Stage Transition Control */}
                  <div className="flex items-center gap-3 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Stage:
                    </label>
                    <select
                      value={app.status}
                      onChange={(e) => handleStatusChange(app.application_id, e.target.value)}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-900 outline-none"
                    >
                      <option value="Applied">Applied</option>
                      <option value="Screening">Screening</option>
                      <option value="Interview">Interview</option>
                      <option value="Offer">Offer</option>
                      <option value="Hired">Hired</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <p className="text-base font-semibold text-slate-700">No candidate applications recorded yet</p>
              <p className="text-xs text-slate-400 mt-1">Candidates applying to your posted roles will appear here with AI Fit Scores.</p>
            </div>
          )}
        </div>
      )}

      {/* Post New Role Tab */}
      {activeTab === "post" && (
        <form onSubmit={handlePostJobSubmit} className="rounded-3xl border border-slate-200 bg-white p-8 shadow-card max-w-2xl space-y-6">
          <h2 className="text-xl font-bold text-slate-950">Post Verified Hiring Listing</h2>

          {postedNotice && (
            <div className="rounded-2xl bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 border border-emerald-200 animate-in fade-in">
              Job listing published successfully! Applicants will be matched with AI fit scores. ✓
            </div>
          )}

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Job Title
              </label>
              <input
                type="text"
                placeholder="e.g. Senior Backend Engineer"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-slate-950"
              />
            </div>

            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Company Name
              </label>
              <input
                type="text"
                placeholder="e.g. Stripe, OpenAI, Vercel"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-slate-950"
              />
            </div>

            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Required Tech Skills (comma separated)
              </label>
              <input
                type="text"
                placeholder="Python, FastAPI, PostgreSQL, Docker"
                value={skillsStr}
                onChange={(e) => setSkillsStr(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-slate-950"
              />
            </div>

            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Job Description
              </label>
              <textarea
                rows={6}
                placeholder="Describe role responsibilities, tech stack, and experience requirements..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-4 text-sm text-slate-900 outline-none focus:border-slate-950"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={posting}
            className="w-full rounded-2xl bg-slate-950 py-3 text-xs font-bold text-white shadow-md hover:bg-slate-800 transition"
          >
            {posting ? "Publishing Role..." : "Publish Hiring Opportunity →"}
          </button>
        </form>
      )}
    </main>
  );
}
