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
    <div className="space-y-16 pb-16">
      {/* Hero Section (Stripe & Linear Polish) */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 text-white pt-16 pb-24 px-4 sm:px-6 rounded-b-[3rem] shadow-2xl">
        {/* Glowing Background Orbs */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative mx-auto max-w-5xl text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold text-indigo-300 backdrop-blur-md">
            <span className="flex h-2 w-2 rounded-full bg-indigo-400 animate-ping" />
            JobNova Platform 2.0 • Real-time Job Scraper Active
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.15] text-white max-w-3xl mx-auto">
            Find Your Next <span className="bg-gradient-to-r from-indigo-400 via-sky-300 to-emerald-400 bg-clip-text text-transparent">Dream Job</span> in Tech
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 font-normal leading-relaxed">
            Directly scraped from top engineering ATS portals (Greenhouse, Lever, Ashby). No dead links or fake listings.
          </p>

          {/* Embedded Search Control Bar */}
          <div className="mx-auto max-w-4xl pt-4">
            <div className="rounded-3xl border border-slate-700/60 bg-slate-900/80 p-3 backdrop-blur-xl shadow-2xl text-left">
              <Suspense fallback={null}>
                <SearchControls />
              </Suspense>
            </div>
          </div>

          {/* Popular Searches Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs text-slate-400">
            <span className="font-semibold text-slate-300">Popular:</span>
            {popularSearches.map((item) => (
              <Link
                key={item.label}
                href={`/jobs?keyword=${encodeURIComponent(item.query)}` as any}
                className="rounded-full bg-slate-800/80 px-3.5 py-1 text-slate-300 hover:bg-slate-700 hover:text-white transition border border-slate-700/50"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Live Statistics Counter Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-10 border-t border-slate-800/80 max-w-4xl mx-auto text-center">
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-white">10,000+</p>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">Active Job Roles</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-white">500+</p>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">Verified Tech Companies</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-white">100%</p>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">Verified Sources</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-white">24/7</p>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">Automated Ingestion</p>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted Companies Logo Wall */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <p className="text-center text-xs font-bold uppercase tracking-[0.3em] text-slate-400 mb-6">
          Scraping verified job portals from market leaders
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 opacity-75 grayscale hover:grayscale-0 transition-all">
          {trustedCompanies.map((comp) => (
            <span key={comp} className="text-lg font-extrabold tracking-tight text-slate-800 font-mono">
              {comp}
            </span>
          ))}
        </div>
      </section>

      {/* Categories Grid */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-8 text-center sm:text-left">
          <h2 className="text-2xl font-bold text-slate-950">Explore by Category</h2>
          <p className="text-sm text-slate-500 mt-1">Browse open roles by domain and specialization.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <Link
              key={cat.name}
              href={`/jobs?keyword=${encodeURIComponent(cat.name.split(" ")[0])}` as any}
              className="flex items-center gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-card hover:border-slate-300 hover:shadow-lg transition group"
            >
              <span className="text-3xl group-hover:scale-110 transition-transform">{cat.icon}</span>
              <div>
                <h3 className="font-bold text-slate-950 group-hover:text-indigo-600 transition">{cat.name}</h3>
                <p className="text-xs text-slate-500">{cat.count}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Main Job Feed Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <JobFeed searchParams={searchParams} />
      </section>

      {/* AI Features Teaser Banner */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-slate-900 to-slate-950 p-8 sm:p-12 text-white shadow-2xl">
          <div className="max-w-2xl space-y-4">
            <span className="rounded-full bg-indigo-500/20 px-3.5 py-1 text-xs font-semibold text-indigo-300 border border-indigo-500/30">
              Coming Soon • AI Resume Suite
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-white">
              Match Your Resume to Target Jobs Automatically
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              JobNova AI analyzes job specifications, computes match scores for your experience, and generates custom cover letters tailored for recruiters.
            </p>
            <button
              type="button"
              className="rounded-2xl bg-white px-6 py-3 text-xs font-bold text-slate-950 shadow-lg hover:bg-slate-100 transition"
            >
              Join AI Waitlist →
            </button>
          </div>
        </div>
      </section>

      {/* Testimonials & FAQs Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 space-y-12">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-950">Frequently Asked Questions</h2>
          <p className="text-sm text-slate-500 mt-1">Everything you need to know about JobNova listing sources.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card space-y-2">
            <h3 className="font-bold text-slate-950 text-base">How does JobNova scrape listings?</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              JobNova continuously queries official ATS APIs and public careers pages for top tech companies (Greenhouse, Lever, Ashby).
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card space-y-2">
            <h3 className="font-bold text-slate-950 text-base">Is JobNova free for candidate job seekers?</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Yes, 100% free. Candidates can search, bookmark roles, track applications, and build their profile at zero cost.
            </p>
          </div>
        </div>
      </section>

      {/* Newsletter Card */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 sm:p-10 shadow-card text-center space-y-4">
          <h2 className="text-2xl font-bold text-slate-950">Get Daily Tech Job Alerts</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Receive personalized remote and high-growth job postings directly in your inbox every morning.
          </p>
          <div className="flex max-w-md mx-auto gap-2">
            <input
              type="email"
              placeholder="Enter your work email..."
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-xs text-slate-900 outline-none focus:border-slate-950"
            />
            <button className="rounded-xl bg-slate-950 px-5 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-slate-800 transition">
              Subscribe Free
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
