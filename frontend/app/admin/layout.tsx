"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { LayoutDashboard, Users, UserCheck, Building2, Briefcase, FileText, Send, Activity, ShieldAlert, LogOut } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (pathname === "/admin/login") {
      setAuthorized(true);
      return;
    }

    if (!loading) {
      if (!user) {
        router.push("/admin/login");
      } else if (user.role !== "admin") {
        router.push("/admin/login?error=forbidden");
      } else {
        setAuthorized(true);
      }
    }
  }, [user, loading, pathname, router]);

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (loading || !authorized) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 font-medium text-xs">
        Verifying administrator authorization...
      </div>
    );
  }

  const navItems = [
    { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Recruiter Queue", href: "/admin/recruiters", icon: UserCheck },
    { label: "Users Registry", href: "/admin/users", icon: Users },
    { label: "Companies", href: "/admin/companies", icon: Building2 },
    { label: "Job Moderation", href: "/admin/jobs", icon: Briefcase },
    { label: "Telegram Control", href: "/admin/telegram", icon: Send },
    { label: "System Health", href: "/admin/system-health", icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans antialiased">
      {/* Enterprise Dark Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900/90 flex flex-col justify-between p-5 shrink-0">
        <div className="space-y-6">
          {/* Admin Header Branding */}
          <div className="flex items-center gap-3 border-b border-slate-800 pb-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 font-black text-white text-lg shadow-lg">
              JN
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white tracking-wide">JobNova Enterprise</h2>
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Admin Control</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href as any}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${

                    isActive
                      ? "bg-blue-600 text-white shadow-md"
                      : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer User Info & Logout */}
        <div className="border-t border-slate-800 pt-4 space-y-3">
          <div className="flex items-center gap-3 text-xs">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-900 font-bold text-white text-xs">
              {user?.full_name?.charAt(0) || "A"}
            </div>
            <div className="truncate">
              <p className="font-bold text-white truncate">{user?.full_name || "Administrator"}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={async () => {
              await logout();
              router.push("/admin/login");
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900 py-2 text-xs font-semibold text-slate-400 hover:text-rose-400 hover:border-rose-900/50 transition"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Admin Body Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-slate-800 bg-slate-900/40 px-8 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <span>Admin</span>
            <span>/</span>
            <span className="text-white capitalize">{pathname.split("/").pop() || "Dashboard"}</span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 font-bold">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Live Telemetry Online
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}
