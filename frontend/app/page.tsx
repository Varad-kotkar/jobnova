import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import JobFeed from "@/components/job-feed";
import SearchControls from "@/components/search-controls";


interface HomePageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function HomePage(props: HomePageProps) {
  const searchParams = await props.searchParams;

  const popularSearches = [
    { label: "🇮🇳 India Jobs", query: "India" },
    { label: "🏠 Remote Jobs", query: "remote" },
    { label: "📊 Data Analyst", query: "data analyst" },
    { label: "🤖 AI Engineer", query: "ai engineer" },
    { label: "🎓 Internships", query: "intern" },
    { label: "💼 Freshers", query: "fresher" },
    { label: "🐍 Python", query: "python" },
    { label: "📊 Power BI / SQL", query: "sql" },
  ];

  const categories = [
    { name: "🇮🇳 India Engineering & Data", icon: "🇮🇳", count: "3,500+ jobs", query: "India" },
    { name: "🏠 Remote & WFH", icon: "🏠", count: "1,800+ jobs", query: "Remote" },
    { name: "📊 Data Analytics & BI", icon: "📊", count: "1,200+ jobs", query: "Data Analyst" },
    { name: "🤖 AI & Machine Learning", icon: "🤖", count: "950+ jobs", query: "AI Engineer" },
    { name: "🎓 Internships & Freshers", icon: "🎓", count: "800+ jobs", query: "Intern" },
    { name: "💻 Full Stack & Backend", icon: "💻", count: "2,100+ jobs", query: "Software" },
  ];

  const trustedCompanies = ["Google", "Microsoft", "Amazon", "NVIDIA", "Flipkart", "Razorpay", "Swiggy", "Zomato", "Zoho"];

  // Fetch live stats from API
  let statsData = {
    total_jobs: 420,
    remote_jobs: 160,
    total_companies: 210,
    total_applications: 95,
  };
  try {
    const { getApiUrl } = await import("@/lib/api");
    const apiRes = await fetch(`${getApiUrl()}/api/stats`, { next: { revalidate: 60 } });
    if (apiRes.ok) {
      const json = await apiRes.json();
      if (json.data) {
        statsData = {
          total_jobs: json.data.total_jobs || 420,
          remote_jobs: json.data.remote_jobs || 160,
          total_companies: json.data.total_companies || 210,
          total_applications: json.data.total_applications || 95,
        };
      }
    }
  } catch {}

  return (
    <div className="space-y-16 pb-16 bg-white">
      {/* Hero Section */}
      <section className="border-b border-gray-100 bg-gray-50/50 py-16 px-4 sm:px-6">
        <div className="mx-auto max-w-4xl text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1 text-xs font-semibold text-blue-700">
            <span className="flex h-2 w-2 rounded-full bg-blue-600" />
            JobNova Platform v1.1 • Real-time Candidate & Recruiter Engine
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 leading-tight">
            The Intelligent Platform for <span className="text-blue-600">Tech Hiring & Growth</span>
          </h1>

          <p className="max-w-2xl mx-auto text-base text-gray-600 font-normal leading-relaxed">
            Indexed directly from verified Greenhouse, Lever, and Ashby portals. Discover engineering roles, evaluate AI fit scores, and build 30-60-90 day career roadmaps.
          </p>

          {/* Embedded Search Control Bar */}
          <div className="mx-auto max-w-3xl pt-2">
            <Suspense fallback={null}>
              <SearchControls />
            </Suspense>
          </div>

          {/* Popular Tag Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs">
            <span className="font-semibold text-gray-400">Popular:</span>
            {popularSearches.map((item) => (
              <Link
                key={item.label}
                href={`/jobs?keyword=${encodeURIComponent(item.query)}`}
                className="rounded-lg bg-white px-3 py-1 font-semibold text-gray-700 border border-gray-200 hover:border-blue-500 hover:text-blue-600 transition shadow-subtle"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Trusted Employer Bar */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <p className="text-center text-xs font-bold uppercase tracking-wider text-gray-400 mb-6">
          Hiring opportunities from top engineering teams
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 text-lg font-bold text-gray-400 opacity-80">
          {trustedCompanies.map((name) => (
            <span key={name} className="hover:text-gray-900 transition cursor-default">
              {name}
            </span>
          ))}
        </div>
      </section>

      {/* Live Platform Statistics Counters */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="rounded-3xl border border-blue-100 bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-purple-50/80 p-8 shadow-subtle grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <p className="text-2xl sm:text-3xl font-black text-blue-900">{statsData.total_jobs}+</p>
            <p className="text-xs font-bold text-blue-700/80 mt-1 uppercase tracking-wide">Live Roles</p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-black text-indigo-900">{statsData.remote_jobs}+</p>
            <p className="text-xs font-bold text-indigo-700/80 mt-1 uppercase tracking-wide">Remote Jobs</p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-black text-emerald-900">{statsData.total_companies}+</p>
            <p className="text-xs font-bold text-emerald-700/80 mt-1 uppercase tracking-wide">Companies</p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-black text-purple-900">{statsData.total_applications}+</p>
            <p className="text-xs font-bold text-purple-700/80 mt-1 uppercase tracking-wide">Applications</p>
          </div>
        </div>
      </section>

      {/* AI Features Spotlight */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-subtle space-y-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-bold text-lg">
              ⚡
            </div>
            <h3 className="text-base font-bold text-gray-900">AI Match Engine</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Multi-factor candidate fit evaluation across skill overlap, role alignment, location preference, and seniority.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-subtle space-y-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 font-bold text-lg">
              🎯
            </div>
            <h3 className="text-base font-bold text-gray-900">ATS Resume Optimizer</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Comprehensive keyword coverage analysis, missing section detection, and actionable formatting guidance.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-subtle space-y-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 font-bold text-lg">
              🚀
            </div>
            <h3 className="text-base font-bold text-gray-900">30-60-90 Day Career Coach</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Synthesizes resume skills, market trends, and application logs into personalized step-by-step career growth roadmaps.
            </p>
          </div>
        </div>
      </section>

      {/* Category Explorer Cards */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Explore Job Categories</h2>
            <p className="text-xs text-gray-500 mt-0.5">Find roles across key technology departments</p>
          </div>
          <Link href="/categories" className="text-xs font-bold text-blue-600 hover:underline">
            View All Categories →
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {categories.map((cat) => (
            <Link
              key={cat.name}
              href={`/jobs?keyword=${encodeURIComponent(cat.query || cat.name)}`}
              className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-subtle hover:border-gray-300 transition flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{cat.icon}</span>
                <div>
                  <h3 className="text-xs font-bold text-gray-900 group-hover:text-blue-600 transition">{cat.name}</h3>
                  <p className="text-[11px] text-gray-500">{cat.count}</p>
                </div>
              </div>
              <span className="text-gray-400 group-hover:text-blue-600 transition">→</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Live Job Feed */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Latest Engineering Listings</h2>
            <p className="text-xs text-gray-500 mt-0.5">Updated continuously from active ATS portals</p>
          </div>
          <Link href="/jobs" className="text-xs font-bold text-blue-600 hover:underline">
            View All Listings ({">"}250) →
          </Link>
        </div>

        <Suspense fallback={<div className="py-10 text-center text-xs font-semibold text-gray-500">Loading active job feed...</div>}>
          <JobFeed searchParams={searchParams} />
        </Suspense>
      </section>

      {/* Career Motivation Meme Spotlight */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid items-center gap-10 rounded-3xl bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-100 p-8 shadow-subtle border border-orange-200/80 md:grid-cols-2">
          <div className="space-y-4">
            <span className="inline-block rounded-full bg-orange-500 px-4 py-1 text-xs font-bold text-white shadow-sm">
              😂 Career Motivation
            </span>

            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight leading-tight">
              Career First... Everything Else Later! 🚀
            </h2>

            <p className="text-sm text-gray-700 leading-relaxed font-medium">
              Every successful engineering career starts with one focused decision.
              Learn continuous skills, apply strategically, and accelerate your growth with JobNova.
            </p>

            <p className="text-xs text-orange-950/70 italic font-semibold">
              "A little humor, but a serious reminder—your career deserves your undivided attention."
            </p>

            <div className="pt-2">
              <Link
                href="/jobs"
                className="inline-block rounded-xl bg-blue-600 px-6 py-3 text-xs font-bold text-white shadow-md hover:bg-blue-700 transition"
              >
                Explore Active Roles →
              </Link>
            </div>
          </div>

          <div className="flex justify-center">
            <Image
              src="/images/career-meme.png"
              alt="Career Motivation Meme"
              width={450}
              height={450}
              className="rounded-2xl shadow-xl border border-white/60 object-cover max-h-[380px]"
            />
          </div>
        </div>
      </section>
    </div>
  );
}

