import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="border-t border-gray-200 bg-white py-12 text-xs text-gray-500">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-4">
          <div className="space-y-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 font-black text-white text-xs">
                JN
              </div>
              <span className="text-base font-bold text-gray-900">
                Job<span className="text-blue-600">Nova</span>
              </span>
            </Link>
            <p className="text-gray-500 leading-relaxed">
              Modern candidate intelligence and employer recruitment platform powered by FastAPI, Next.js, PostgreSQL, and AI.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 uppercase tracking-wider mb-3">Candidate Intelligence</h4>
            <ul className="space-y-2 font-medium">
              <li><Link href="/jobs" className="hover:text-gray-900 transition">Browse Engineering Jobs</Link></li>
              <li><Link href="/career-coach" className="hover:text-gray-900 transition">AI Career Coach</Link></li>
              <li><Link href="/dashboard" className="hover:text-gray-900 transition">Application CRM Dashboard</Link></li>
              <li><Link href="/profile" className="hover:text-gray-900 transition">ATS Resume Parsing</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 uppercase tracking-wider mb-3">Employers & Companies</h4>
            <ul className="space-y-2 font-medium">
              <li><Link href="/companies" className="hover:text-gray-900 transition">Tech Employers Directory</Link></li>
              <li><Link href="/recruiter" className="hover:text-gray-900 transition">Employer Portal</Link></li>
              <li><Link href="/recruiter?tab=post" className="hover:text-gray-900 transition">Post Verified Role</Link></li>
              <li><Link href="/about" className="hover:text-gray-900 transition">Platform Architecture</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 uppercase tracking-wider mb-3">Security & Health</h4>
            <ul className="space-y-2 font-medium">
              <li><span className="text-emerald-600 font-bold">● System Health: Healthy</span></li>
              <li><span>API Version: v1.1 Production</span></li>
              <li><span>Architecture: FastAPI + Next.js</span></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-gray-100 pt-6 flex flex-col sm:flex-row items-center justify-between text-gray-400">
          <p>© {new Date().getFullYear()} JobNova Platform. All rights reserved.</p>
          <div className="flex gap-4 mt-2 sm:mt-0 font-medium">
            <Link href="/about" className="hover:text-gray-600">Privacy Policy</Link>
            <Link href="/about" className="hover:text-gray-600">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
