import { Suspense } from "react";
import Link from "next/link";
import JobFeed from "@/components/job-feed";
import SearchControls from "@/components/search-controls";

interface HomePageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function HomePage(props: HomePageProps) {
  const searchParams = await props.searchParams;

  const popularSearches = [
    { label: "Frontend", query: "frontend" },
    { label: "Full Stack", query: "full stack" },
    { label: "Backend", query: "backend" },
    { label: "AI / ML", query: "ai" },
    { label: "React / Next.js", query: "react" },
    { label: "Python", query: "python" },
  ];

  const categories = [
    { name: "Software Engineering", icon: "💻", count: "4,200+ jobs" },
    { name: "Product & Design", icon: "🎨", count: "1,100+ jobs" },
    { name: "AI & Data Science", icon: "🤖", count: "950+ jobs" },
    { name: "DevOps & Cloud", icon: "⚡", count: "800+ jobs" },
    { name: "Marketing & Growth", icon: "🚀", count: "600+ jobs" },
    { name: "Finance & Operations", icon: "📊", count: "500+ jobs" },
  ];

  const trustedCompanies = ["Stripe", "Vercel", "Linear", "Figma", "Notion", "Datadog"];

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
              href={`/jobs?keyword=${encodeURIComponent(cat.name.split(" ")[0])}`}
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
    </div>
  );
}
