import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="text-lg font-semibold text-slate-950">
          JobNova
        </Link>
        <nav className="flex items-center gap-4 text-sm text-slate-600">
          <Link href="/jobs" className="hover:text-slate-950 font-medium">
            Jobs
          </Link>
          <Link href="/companies" className="hover:text-slate-950">
            Companies
          </Link>
          <Link href="/about" className="hover:text-slate-950">
            About
          </Link>
        </nav>
      </div>
    </header>
  );
}
