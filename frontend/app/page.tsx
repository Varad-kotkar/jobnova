import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import type { Route } from "next";
import CuratedHomeSections from "@/components/curated-home-sections";
import SearchControls from "@/components/search-controls";
import TrendingCompanies from "@/components/trending-companies";
import { getHomeJobs, getMemes } from "@/lib/api";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "JobNova — India's AI-Powered Tech Job Discovery Platform",
  description:
    "Discover curated tech roles, internships, fresher jobs and remote opportunities in India and globally. Updated continuously from verified ATS portals.",
  openGraph: {
    title: "JobNova — AI Job Platform for India",
    description: "Curated tech roles, internships, fresher & remote jobs. Updated daily.",
    type: "website",
  },
};

interface HomePageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

const popularSearches = [
  { label: "🇮🇳 India Jobs", query: "India", href: "/jobs?country=India" },
  { label: "🏠 Remote Jobs", query: "remote", href: "/jobs?remote=true" },
  { label: "🎓 Internships", query: "intern", href: "/jobs?employment_type=Internship" },
  { label: "👨‍🎓 Freshers", query: "fresher", href: "/jobs?experience_level=Fresher" },
  { label: "📊 Data Analyst", query: "data analyst", href: "/jobs?keyword=data+analyst" },
  { label: "🤖 AI Engineer", query: "ai engineer", href: "/jobs?keyword=ai+engineer" },
  { label: "🐍 Python", query: "python", href: "/jobs?keyword=python" },
  { label: "☁️ Cloud & DevOps", query: "cloud", href: "/jobs?category=Cloud+%26+DevOps" },
];

const categories = [
  { name: "🇮🇳 India Tech Jobs", count: "3,500+", href: "/jobs?country=India", gradient: "from-orange-50 to-amber-50", border: "border-orange-200" },
  { name: "🏠 Remote & WFH", count: "1,800+", href: "/jobs?remote=true", gradient: "from-blue-50 to-cyan-50", border: "border-blue-200" },
  { name: "🎓 Internships", count: "800+", href: "/jobs?employment_type=Internship", gradient: "from-emerald-50 to-green-50", border: "border-emerald-200" },
  { name: "📊 Data & Analytics", count: "1,200+", href: "/jobs?category=Data+Science+%26+Analytics", gradient: "from-purple-50 to-violet-50", border: "border-purple-200" },
  { name: "🤖 AI & ML", count: "950+", href: "/jobs?category=AI+%26+Machine+Learning", gradient: "from-rose-50 to-pink-50", border: "border-rose-200" },
  { name: "💻 Full Stack & Backend", count: "2,100+", href: "/jobs?category=Software+Engineering", gradient: "from-indigo-50 to-blue-50", border: "border-indigo-200" },
];

const aiTools = [
  {
    icon: "⚡",
    title: "AI Match Engine",
    desc: "Multi-factor candidate fit evaluation across skills, role alignment, location, and seniority.",
    href: "/career-coach",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: "🎯",
    title: "ATS Resume Optimizer",
    desc: "Keyword coverage analysis, missing section detection, and actionable formatting guidance.",
    href: "/profile",
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    icon: "🚀",
    title: "30-60-90 Day Career Coach",
    desc: "Personalized step-by-step career growth roadmaps synthesized from your resume and market trends.",
    href: "/career-coach",
    color: "bg-purple-50 text-purple-600",
  },
];

const trustedCompanies = [
  "Google", "Stripe", "Microsoft", "Amazon", "NVIDIA", "Razorpay",
  "Swiggy", "Zomato", "Zoho", "Vercel", "Figma", "Notion", "Freshworks", "Postman",
];

// Dynamically import DeveloperCorner to reduce initial bundle (lazy loading)
const DeveloperCorner = dynamic(() => import("@/components/developer-corner"), {
  loading: () => (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <div className="h-8 w-64 bg-slate-200 rounded-lg animate-pulse mb-6" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl bg-slate-100 animate-pulse" style={{ aspectRatio: "16/9" }} />
        ))}
      </div>
    </div>
  ),
});

export default async function HomePage(props: HomePageProps) {
  await props.searchParams;

  // Parallel server-side fetches
  const [initialHomeJobs, initialMemes] = await Promise.allSettled([
    getHomeJobs(),
    getMemes(),
  ]);

  const homeJobs = initialHomeJobs.status === "fulfilled" ? initialHomeJobs.value : null;
  const memes = initialMemes.status === "fulfilled" ? initialMemes.value : [];
  const trendingCompanies = homeJobs?.trending_companies || [];

  // Fetch live stats
  let statsData = { total_jobs: 500, remote_jobs: 200, total_companies: 250, total_applications: 120 };
  try {
    const { getApiUrl } = await import("@/lib/api");
    const apiRes = await fetch(`${getApiUrl()}/api/stats`, { cache: "no-store" });
    if (apiRes.ok) {
      const json = await apiRes.json();
      if (json.data) {
        statsData = {
          total_jobs: json.data.total_jobs || statsData.total_jobs,
          remote_jobs: json.data.remote_jobs || statsData.remote_jobs,
          total_companies: json.data.total_companies || statsData.total_companies,
          total_applications: json.data.total_applications || statsData.total_applications,
        };
      }
    }
  } catch { /* non-critical */ }

  return (
    <div className="space-y-20 pb-20 bg-white">

      {/* ━━━━━━━━━━━━ HERO ━━━━━━━━━━━━ */}
      <section className="relative overflow-hidden border-b border-gray-100 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 py-20 px-4 sm:px-6">
        {/* Background grid decoration */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2230%22 height=%2230%22 viewBox=%220 0 30 30%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cpath d=%22M0 0h30v30H0z%22 fill=%22none%22/%3E%3Cpath d=%22M0 30L30 0M30 30L0 0%22 stroke=%22%23ffffff08%22 stroke-width=%221%22/%3E%3C/svg%3E')] opacity-40" />
        <div className="relative mx-auto max-w-4xl text-center space-y-7">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold text-blue-300 backdrop-blur">
            <span className="flex h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
            JobNova • India&apos;s AI-Powered Tech Job Platform
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Discover Your Next{" "}
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">
              Tech Career
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-400 font-normal leading-relaxed">
            Curated internships, freshers roles, India jobs &amp; remote opportunities — indexed
            continuously from verified ATS portals. Zero noise.
          </p>

          {/* Search Bar */}
          <div className="mx-auto max-w-3xl pt-2">
            <Suspense fallback={<div className="h-14 bg-white/10 rounded-2xl animate-pulse" />}>
              <SearchControls />
            </Suspense>
          </div>

          {/* Popular Tag Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs">
            <span className="font-semibold text-slate-500">Popular:</span>
            {popularSearches.map((item) => (
              <Link
                key={item.label}
                href={item.href as Route}
                className="rounded-full bg-white/8 border border-white/10 px-3 py-1 font-semibold text-slate-300 hover:border-blue-400/60 hover:text-blue-300 hover:bg-blue-500/10 transition-all"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━ TRUSTED COMPANIES TICKER ━━━━━━━━━━━━ */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <p className="text-center text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-5">
          Curated opportunities from verified technology teams
        </p>
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-base font-bold text-slate-400">
          {trustedCompanies.map((name) => (
            <span key={name} className="hover:text-slate-700 transition cursor-default whitespace-nowrap">
              {name}
            </span>
          ))}
        </div>
      </section>

      {/* ━━━━━━━━━━━━ LIVE STATS ━━━━━━━━━━━━ */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="rounded-3xl border border-blue-100 bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-purple-50/80 p-8 shadow-sm grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: statsData.total_jobs, label: "Live Tech Roles", color: "text-blue-900" },
            { value: statsData.remote_jobs, label: "Remote Jobs", color: "text-indigo-900" },
            { value: statsData.total_companies, label: "Verified Companies", color: "text-emerald-900" },
            { value: statsData.total_applications, label: "Applications Sent", color: "text-purple-900" },
          ].map((stat) => (
            <div key={stat.label}>
              <p className={`text-2xl sm:text-3xl font-black ${stat.color}`}>{stat.value}+</p>
              <p className="text-[11px] font-bold text-slate-500 mt-1 uppercase tracking-wide">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ━━━━━━━━━━━━ CURATED JOB SECTIONS (DB-DRIVEN) ━━━━━━━━━━━━ */}
      <CuratedHomeSections initialData={homeJobs} />

      {/* ━━━━━━━━━━━━ TRENDING COMPANIES ━━━━━━━━━━━━ */}
      {trendingCompanies.length > 0 && (
        <TrendingCompanies companies={trendingCompanies} />
      )}

      {/* ━━━━━━━━━━━━ AI CAREER TOOLS ━━━━━━━━━━━━ */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">🤖 AI Career Tools</h2>
          <p className="text-xs text-slate-500 mt-0.5">Powered by AI to accelerate your job search</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          {aiTools.map((tool) => (
            <Link
              key={tool.title}
              href={tool.href as Route}
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-lg hover:border-blue-300 transition-all duration-300 space-y-3"
            >
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${tool.color} font-bold text-xl`}>
                {tool.icon}
              </div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{tool.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{tool.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ━━━━━━━━━━━━ TRENDING CATEGORIES ━━━━━━━━━━━━ */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">📚 Explore Tech Categories</h2>
            <p className="text-xs text-slate-500 mt-0.5">Find roles across key technology departments</p>
          </div>
          <Link href="/jobs" className="text-xs font-bold text-blue-600 hover:underline">
            View Full Catalog →
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <Link
              key={cat.name}
              href={cat.href as Route}
              className={`group rounded-2xl border ${cat.border} bg-gradient-to-br ${cat.gradient} p-5 hover:shadow-md transition-all duration-300 flex items-center justify-between`}
            >
              <div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">{cat.name}</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">{cat.count} active roles</p>
              </div>
              <span className="text-slate-400 group-hover:text-blue-600 transition font-bold">→</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ━━━━━━━━━━━━ DEVELOPER CORNER (near bottom) ━━━━━━━━━━━━ */}
      <DeveloperCorner initialMemes={memes} />

    </div>
  );
}
