import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white text-slate-600 text-sm">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
          {/* Brand Col */}
          <div className="col-span-2 lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-900 text-white font-extrabold text-base">
                J
              </div>
              <span className="text-xl font-extrabold tracking-tight text-slate-950">
                Job<span className="text-indigo-600">Nova</span>
              </span>
            </Link>
            <p className="max-w-sm text-xs text-slate-500 leading-relaxed">
              JobNova is a modern, candidate-focused job platform indexing real listings from top startup ecosystems like Greenhouse, Lever, Ashby, and verified tech hubs.
            </p>
            <div className="flex items-center gap-3 text-slate-400">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-slate-950 transition">
                <span className="sr-only">GitHub</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-slate-950 transition">
                <span className="sr-only">LinkedIn</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.74a1.48 1.48 0 1 0 0 2.96 1.48 1.48 0 0 0 0-2.96z" />
                </svg>
              </a>
              <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="hover:text-slate-950 transition">
                <span className="sr-only">Twitter / X</span>
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Links Col 1 */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-950">Platform</h3>
            <ul className="mt-4 space-y-2.5 text-xs">
              <li><Link href="/jobs" className="hover:text-slate-950">Browse All Jobs</Link></li>
              <li><Link href={"/jobs?remote=true" as any} className="hover:text-slate-950">Remote Jobs</Link></li>
              <li><Link href="/companies" className="hover:text-slate-950">Top Companies</Link></li>
              <li><Link href="/dashboard" className="hover:text-slate-950">Candidate Dashboard</Link></li>
            </ul>
          </div>

          {/* Links Col 2 */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-950">Resources</h3>
            <ul className="mt-4 space-y-2.5 text-xs">
              <li><Link href="/about" className="hover:text-slate-950">About JobNova</Link></li>
              <li><a href="#" className="hover:text-slate-950">Engineering Blog</a></li>
              <li><a href="#" className="hover:text-slate-950">AI Resume Matcher</a></li>
              <li><a href="#" className="hover:text-slate-950">Salary Benchmarks</a></li>
            </ul>
          </div>

          {/* Links Col 3 */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-950">Legal & Support</h3>
            <ul className="mt-4 space-y-2.5 text-xs">
              <li><a href="#" className="hover:text-slate-950">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-slate-950">Terms of Service</a></li>
              <li><a href="#" className="hover:text-slate-950">Security</a></li>
              <li><a href="#" className="hover:text-slate-950">Contact Us</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-slate-100 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© {new Date().getFullYear()} JobNova, Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>Built with Next.js 15 & FastAPI</span>
            <span>•</span>
            <span className="flex items-center gap-1.5 font-medium text-emerald-600">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              All Systems Operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
