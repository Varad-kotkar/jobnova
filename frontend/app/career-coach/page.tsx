"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getApiUrl } from "@/lib/api";

interface CareerRoadmapData {
  career_stage: string;
  career_confidence_score: number;
  current_strengths: string[];
  skill_gaps: string[];
  recommended_skills: string[];
  learning_resources: string[];
  recommended_projects: Array<{
    title: string;
    description: string;
  }>;
  certifications: string[];
  salary_projection: {
    min: string;
    max: string;
    currency: string;
  };
  plan_30_day: string[];
  plan_60_day: string[];
  plan_90_day: string[];
  recommended_job_roles: string[];
}

export default function CareerCoachPage() {
  const [roadmap, setRoadmap] = useState<CareerRoadmapData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("jobnova_token");
    if (token && token !== "demo-jwt-token") {
      const apiBase = getApiUrl();
      fetch(`${apiBase}/api/users/career-roadmap`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) setRoadmap(data);
        })
        .catch((err) => console.warn("Career roadmap fetch error:", err))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      {/* Top Bar */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-950">
            AI Career Coach & Skill Gap Roadmap 🚀
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Personalized 30-60-90 day growth plan, target salary trajectories, and skill gap reports.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-card hover:bg-slate-50 transition"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm font-semibold text-slate-600">
          Analyzing career trajectory, market skill demands, and candidate profile...
        </div>
      ) : roadmap ? (
        <div className="space-y-10">
          {/* Header Metric Cards */}
          <div className="grid gap-5 sm:grid-cols-3">
            <div className="rounded-3xl border border-indigo-200 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6 text-white shadow-card">
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-300">Career Stage</p>
              <p className="mt-2 text-3xl font-extrabold text-white">{roadmap.career_stage}</p>
              <p className="mt-1 text-xs text-slate-400">Based on verified skills & application velocity</p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Career Readiness Score</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-3xl font-extrabold text-emerald-600">{roadmap.career_confidence_score}%</span>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  High Market Alignment
                </span>
              </div>
              <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${roadmap.career_confidence_score}%` }}
                />
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Target Salary Trajectory</p>
              <p className="mt-2 text-3xl font-extrabold text-slate-950">
                {roadmap.salary_projection.min} – {roadmap.salary_projection.max}
              </p>
              <p className="mt-1 text-xs text-slate-500">Estimated market range for your role level</p>
            </div>
          </div>

          {/* Skill Gap vs Strengths Grid */}
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card space-y-4">
              <h2 className="text-lg font-bold text-slate-950 flex items-center gap-2">
                <span className="text-emerald-600">✓</span> Verified Strengths ({roadmap.current_strengths.length})
              </h2>
              <div className="flex flex-wrap gap-2">
                {roadmap.current_strengths.map((s) => (
                  <span key={s} className="rounded-xl bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card space-y-4">
              <h2 className="text-lg font-bold text-slate-950 flex items-center gap-2">
                <span className="text-amber-600">⚡</span> High-Demand Skill Gaps ({roadmap.skill_gaps.length})
              </h2>
              <div className="flex flex-wrap gap-2">
                {roadmap.skill_gaps.map((g) => (
                  <span key={g} className="rounded-xl bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 border border-amber-200">
                    + {g}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* 30-60-90 Day Roadmap Timeline */}
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-card space-y-6">
            <h2 className="text-xl font-bold text-slate-950">30-60-90 Day Technical Growth Plan</h2>
            <div className="grid gap-6 sm:grid-cols-3">
              <div className="rounded-2xl bg-indigo-50/70 p-5 border border-indigo-100 space-y-3">
                <span className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-extrabold text-white">Month 1 (30 Days)</span>
                <ul className="space-y-2 text-xs text-slate-700">
                  {roadmap.plan_30_day.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="font-bold text-indigo-600">•</span> {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl bg-purple-50/70 p-5 border border-purple-100 space-y-3">
                <span className="rounded-full bg-purple-600 px-3 py-1 text-xs font-extrabold text-white">Month 2 (60 Days)</span>
                <ul className="space-y-2 text-xs text-slate-700">
                  {roadmap.plan_60_day.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="font-bold text-purple-600">•</span> {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl bg-emerald-50/70 p-5 border border-emerald-100 space-y-3">
                <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-extrabold text-white">Month 3 (90 Days)</span>
                <ul className="space-y-2 text-xs text-slate-700">
                  {roadmap.plan_90_day.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="font-bold text-emerald-600">•</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Recommended Portfolio Projects */}
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-card space-y-4">
            <h2 className="text-xl font-bold text-slate-950">Recommended Portfolio Projects</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {roadmap.recommended_projects.map((proj, idx) => (
                <div key={idx} className="rounded-2xl border border-slate-200 p-5 bg-slate-50/50">
                  <h3 className="text-sm font-bold text-slate-950">{proj.title}</h3>
                  <p className="text-xs text-slate-600 mt-1">{proj.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-base font-semibold text-slate-700">Please log in to generate your AI Career Roadmap</p>
          <p className="text-xs text-slate-400 mt-1">Authenticating will analyze your candidate profile and skill progress.</p>
        </div>
      )}
    </main>
  );
}
