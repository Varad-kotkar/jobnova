import Link from "next/link";
import Image from "next/image";
import { LOGO, LOGO_ALT } from "@/lib/logo";

export default function NotFound() {
  return (
    <main className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-20 bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-md text-center space-y-6">
        <Image
          src={LOGO.icon}
          alt={LOGO_ALT.icon}
          width={64}
          height={64}
          className="h-16 w-16 mx-auto opacity-30"
        />
        <div className="space-y-2">
          <h1 className="text-7xl font-black text-slate-200 tracking-tighter">404</h1>
          <h2 className="text-xl font-bold text-slate-900">Page Not Found</h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
            Let&apos;s get you back on track.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-blue-700 transition"
          >
            Go Home
          </Link>
          <Link
            href="/jobs"
            className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition"
          >
            Browse Jobs
          </Link>
        </div>
      </div>
    </main>
  );
}
