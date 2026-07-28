import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";

export const metadata: Metadata = {
  title: "Copyright & Attribution — JobNova",
  description: "JobNova is a job discovery and aggregation platform. Job postings, logos and trademarks belong to their respective companies.",
};

export default function CopyrightPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 space-y-10">
      <div className="border-b border-gray-100 pb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Copyright &amp; Attribution</h1>
        <p className="mt-3 text-sm text-gray-500 leading-relaxed">
          Last updated: {new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">About JobNova</h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          JobNova is a <strong>job discovery and aggregation platform</strong>. We index publicly
          available job listings from verified company Applicant Tracking Systems (ATS) and
          official company careers pages to help job seekers discover opportunities in one place.
        </p>
        <p className="text-sm text-gray-600 leading-relaxed">
          JobNova does <strong>not</strong> host, repost, or reproduce job content for commercial
          gain. Every listing on JobNova includes a direct &ldquo;Apply&rdquo; button that redirects
          users to the original employer&apos;s careers page. We serve as a discovery layer, not a
          replacement for the original source.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Intellectual Property</h2>
        <ul className="space-y-3 text-sm text-gray-600 leading-relaxed">
          <li className="flex gap-2"><span className="text-blue-600 font-bold shrink-0">•</span> Job postings, position descriptions, and hiring requirements remain the intellectual property of their respective companies.</li>
          <li className="flex gap-2"><span className="text-blue-600 font-bold shrink-0">•</span> Company names, logos, trademarks, and brand assets belong to their respective owners. JobNova does not claim ownership of any third-party brand identity.</li>
          <li className="flex gap-2"><span className="text-blue-600 font-bold shrink-0">•</span> Company logos displayed on JobNova are fetched from publicly available sources (e.g. Clearbit Logo API) and are used solely for identification purposes.</li>
          <li className="flex gap-2"><span className="text-blue-600 font-bold shrink-0">•</span> JobNova&apos;s own brand, name, design system, codebase, and original written content are the intellectual property of JobNova.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">How We Use Job Content</h2>
        <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-5 space-y-2">
          <p className="text-sm text-blue-900 font-semibold">Our commitment to original employers:</p>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>✅ Every &ldquo;Apply&rdquo; button on JobNova directs applicants to the <strong>original company&apos;s careers page</strong></li>
            <li>✅ We do not collect applications on behalf of employers</li>
            <li>✅ We do not charge job seekers for accessing listings</li>
            <li>✅ We credit the source company on every job listing</li>
            <li>✅ Listings are automatically removed after 30 days of inactivity</li>
          </ul>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">DMCA &amp; Content Removal</h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          If you are a rights holder and believe any content on JobNova infringes your copyright
          or trademark, you may request removal by contacting us. We will review and act on valid
          requests within <strong>7 business days</strong>.
        </p>
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 space-y-3 text-sm text-gray-700">
          <p className="font-semibold">To submit a removal request, please include:</p>
          <ol className="space-y-1.5 list-decimal list-inside">
            <li>Your name and company / organization</li>
            <li>The specific URL(s) of the content you want removed</li>
            <li>A brief description of the copyright or trademark being infringed</li>
            <li>Your contact email for our response</li>
          </ol>
          <p>
            Send requests to:{" "}
            <a href="mailto:legal@jobnova.app" className="text-blue-600 hover:underline font-semibold">
              legal@jobnova.app
            </a>
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Disclaimer</h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          JobNova makes no warranties about the accuracy, completeness, or timeliness of job listings.
          Listings are indexed automatically from public sources. JobNova is not responsible for the
          content of external job postings or the hiring decisions of employers.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900">Related Policies</h2>
        <div className="flex flex-wrap gap-3">
          {[
            { href: "/privacy", label: "Privacy Policy" },
            { href: "/terms", label: "Terms of Service" },
            { href: "/contact", label: "Contact Us" },
          ].map((link) => (
              <Link
              key={link.href}
              href={link.href as Route}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:border-blue-400 hover:text-blue-600 transition"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
