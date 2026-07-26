"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import AuthModal from "@/components/auth-modal";
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

const DEFAULT_DEMO_ROADMAP: CareerRoadmapData = {
  career_stage: "Mid-Level Software Engineer",
  career_confidence_score: 88,
  current_strengths: ["TypeScript & React", "FastAPI / Python", "PostgreSQL Schema Design", "REST API Development"],
  skill_gaps: ["Distributed Caching (Redis)", "Docker Container Orchestration", "System Performance Profiling"],
  recommended_skills: ["Redis Caching", "Docker Compose", "CI/CD Workflows", "Prometheus Telemetry"],
  learning_resources: ["System Design Primer", "FastAPI Advanced Architecture", "React Query & Next.js Performance"],
  recommended_projects: [
    {
      title: "Real-time Analytics Dashboard",
      description: "Build a high-throughput event processing pipeline with Redis pub/sub and WebSockets.",
    },
    {
      title: "Distributed Task Queue Worker",
      description: "Implement an asynchronous background job processing engine with retries and dead-letter queues.",
    },
  ],
  certifications: ["AWS Certified Solutions Architect", "Docker Certified Associate"],
  salary_projection: {
    min: "$120,000",
    max: "$165,000",
    currency: "USD",
  },
  plan_30_day: [
    "Master Redis TTL caching and key invalidation patterns",
    "Audit application database queries for N+1 performance bottlenecks",
    "Implement structured logging and correlation request IDs",
  ],
  plan_60_day: [
    "Build multi-stage Dockerfiles for backend and frontend microservices",
    "Set up automated CI/CD pipeline running Pytest unit tests on every PR",
    "Integrate Prometheus metrics export endpoint for application observability",
  ],
  plan_90_day: [
    "Deploy application to cloud infrastructure (Railway & Vercel)",
    "Conduct load testing and optimize response latency under 100ms",
    "Finalize portfolio project documentation and system architecture diagrams",
  ],
  recommended_job_roles: ["Senior Full Stack Engineer", "Backend Systems Engineer", "Tech Lead / Architect"],
};

export default function CareerCoachPage() {
  const { user, token } = useAuth();
  const [roadmap, setRoadmap] = useState<CareerRoadmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    if (token) {
      const apiBase = getApiUrl();
      fetch(`${apiBase}/api/users/career-roadmap`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.career_stage) {
            setRoadmap(data);
          } else {
            setRoadmap(DEFAULT_DEMO_ROADMAP);
          }
        })
        .catch(() => setRoadmap(DEFAULT_DEMO_ROADMAP))
        .finally(() => setLoading(false));
    } else {
      setRoadmap(DEFAULT_DEMO_ROADMAP);
      setLoading(false);
    }
  }, [user, token]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 space-y-8 bg-white">
      {/* Top Header Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
            AI Career Coach & 30-60-90 Day Growth Roadmap 🚀
          </h1>
          <p className="mt-1 text-xs text-gray-500 max-w-2xl leading-relaxed">
            Synthesizes candidate skills, application activity, and tech market demand into a structured career progression plan.
          </p>
        </div>

        {!user && (
          <button
            type="button"
            onClick={() => setAuthModalOpen(true)}
            className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-subtle hover:bg-blue-700 transition self-start sm:self-auto"
          >
            Sign In to Tailor Roadmap
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs font-semibold text-gray-500">
          Generating personalized career roadmap...
        </div>
      ) : roadmap ? (
        <div className="space-y-8">
          {/* Executive Overview Cards */}
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-subtle space-y-1">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Career Stage</span>
              <p className="text-sm font-extrabold text-gray-900">{roadmap.career_stage}</p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-subtle space-y-1">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Readiness Index</span>
              <p className="text-sm font-extrabold text-blue-600">⚡ {roadmap.career_confidence_score}% Ready</p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-subtle space-y-1">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Target Salary</span>
              <p className="text-sm font-extrabold text-emerald-600">
                {roadmap.salary_projection.min} - {roadmap.salary_projection.max}
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-subtle space-y-1">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Target Role</span>
              <p className="text-sm font-extrabold text-gray-900 truncate">
                {roadmap.recommended_job_roles[0] || "Senior Engineer"}
              </p>
            </div>
          </div>

          {/* Skill Gap Analysis & Strengths */}
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-card space-y-4">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500" /> Current Verified Strengths
              </h2>
              <div className="flex flex-wrap gap-2">
                {roadmap.current_strengths.map((str, idx) => (
                  <span key={idx} className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 border border-emerald-200">
                    ✓ {str}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-card space-y-4">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-amber-500" /> Recommended Priority Skills
              </h2>
              <div className="flex flex-wrap gap-2">
                {roadmap.skill_gaps.map((sg, idx) => (
                  <span key={idx} className="rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 border border-amber-200">
                    + {sg}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* 30-60-90 Day Timeline */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-card space-y-6">
            <h2 className="text-lg font-bold text-gray-900">30-60-90 Day Execution Timeline</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-blue-50/50 p-5 border border-blue-100 space-y-3">
                <span className="rounded-md bg-blue-600 px-2.5 py-1 text-[11px] font-bold text-white">Month 1 (30 Days)</span>
                <ul className="space-y-2 text-xs text-gray-700">
                  {roadmap.plan_30_day.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="font-bold text-blue-600">•</span> {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl bg-purple-50/50 p-5 border border-purple-100 space-y-3">
                <span className="rounded-md bg-purple-600 px-2.5 py-1 text-[11px] font-bold text-white">Month 2 (60 Days)</span>
                <ul className="space-y-2 text-xs text-gray-700">
                  {roadmap.plan_60_day.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="font-bold text-purple-600">•</span> {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl bg-emerald-50/50 p-5 border border-emerald-100 space-y-3">
                <span className="rounded-md bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white">Month 3 (90 Days)</span>
                <ul className="space-y-2 text-xs text-gray-700">
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
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-card space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Recommended Portfolio Projects</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {roadmap.recommended_projects.map((proj, idx) => (
                <div key={idx} className="rounded-xl border border-gray-200 p-4 bg-gray-50/50 space-y-1">
                  <h3 className="text-xs font-bold text-gray-900">{proj.title}</h3>
                  <p className="text-xs text-gray-600 leading-relaxed">{proj.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} initialMode="signin" />
    </main>
  );
}
