"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import AuthModal from "@/components/auth-modal";
import { getApiUrl } from "@/lib/api";
import { getSavedJobs } from "@/lib/storage";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: string;
  is_read: boolean;
  created_at?: string | null;
}

export default function SiteHeader() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [savedCount, setSavedCount] = useState(0);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const updateSaved = () => {
      setSavedCount(getSavedJobs().length);
    };
    updateSaved();
    window.addEventListener("jobnova_saved_jobs_changed", updateSaved);
    return () => window.removeEventListener("jobnova_saved_jobs_changed", updateSaved);
  }, []);

  useEffect(() => {
    // Fetch notifications if token exists
    const token = localStorage.getItem("jobnova_token");
    if (token && token !== "demo-jwt-token") {
      const apiBase = getApiUrl();
      fetch(`${apiBase}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) {
            setNotifications(data.notifications || []);
            setUnreadCount(data.unread_count || 0);
          }
        })
        .catch((err) => console.warn("Notifications fetch error:", err));
    }
  }, [user]);

  const handleMarkAllRead = async () => {
    const token = localStorage.getItem("jobnova_token");
    if (token && token !== "demo-jwt-token") {
      const apiBase = getApiUrl();
      try {
        await fetch(`${apiBase}/api/notifications/read-all`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        setUnreadCount(0);
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      } catch (err) {
        console.warn("Mark read error:", err);
      }
    }
  };

  const openAuth = (mode: "signin" | "signup") => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const navLinks = [
    { href: "/jobs", label: "Jobs" },
    { href: "/jobs?remote=true", label: "Remote Jobs" },
    { href: "/companies", label: "Companies" },
    { href: "/career-coach", label: "Career Coach 🚀" },
    { href: "/about", label: "About" },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl transition-all">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
          {/* Logo Mark */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-900 text-white font-extrabold text-lg shadow-md group-hover:scale-105 transition-transform">
              J
            </div>
            <span className="text-xl font-extrabold tracking-tight text-slate-950">
              Job<span className="text-indigo-600">Nova</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href as any}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-slate-100 text-slate-950 font-semibold"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Actions / Auth State */}
          <div className="flex items-center gap-3">
            {/* Notification Bell Dropdown */}
            {user && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setNotifMenuOpen(!notifMenuOpen)}
                  className="relative rounded-full border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 transition"
                  title="Notifications"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-extrabold text-white">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {notifMenuOpen && (
                  <div
                    onMouseLeave={() => setNotifMenuOpen(false)}
                    className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-xs font-extrabold text-slate-950">Candidate Notifications</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-[11px] font-bold text-indigo-600 hover:underline"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>

                    <div className="max-h-64 overflow-y-auto space-y-2 divide-y divide-slate-100">
                      {notifications.length > 0 ? (
                        notifications.map((n) => (
                          <div key={n.id} className="pt-2 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-950">{n.title}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${n.priority === "High" ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-700"}`}>
                                {n.priority}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 mt-1">{n.message}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-500 py-4 text-center">No unread notifications.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Saved Jobs Badge */}
            <Link
              href="/dashboard?tab=saved"
              className="relative flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-card hover:bg-slate-50 transition"
              title="Saved Jobs"
            >
              <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              <span className="hidden sm:inline">Saved</span>
              {savedCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-950 text-[10px] font-bold text-white">
                  {savedCount}
                </span>
              )}
            </Link>

            {user ? (
              /* User Avatar Dropdown */
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 rounded-full border border-slate-200 bg-white p-1 pr-3 text-xs font-semibold text-slate-800 shadow-card hover:border-slate-300 transition"
                >
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.full_name || "User"}
                      className="h-7 w-7 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-950 font-bold text-white uppercase text-xs">
                      {(user.full_name || user.email || "U").charAt(0)}
                    </div>
                  )}
                  <span className="max-w-[100px] truncate font-medium">
                    {user.full_name || user.email?.split("@")[0]}
                  </span>
                  <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {userMenuOpen && (
                  <div
                    onMouseLeave={() => setUserMenuOpen(false)}
                    className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2"
                  >
                    <div className="px-3 py-2 border-b border-slate-100 mb-1">
                      <p className="text-xs font-bold text-slate-950 truncate">{user.full_name || "Candidate"}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                    </div>
                    <Link
                      href="/dashboard"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-950 transition"
                    >
                      Candidate Dashboard
                    </Link>
                    <Link
                      href="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-950 transition"
                    >
                      My Profile
                    </Link>
                    <div className="border-t border-slate-100 my-1 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false);
                          logout();
                        }}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition"
                      >
                        Log Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Guest Actions */
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openAuth("signin")}
                  className="rounded-full px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => openAuth("signup")}
                  className="rounded-full bg-slate-950 px-4.5 py-2 text-xs font-semibold text-white shadow-md hover:bg-slate-800 transition"
                >
                  Get Started →
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} initialMode={authMode} />
    </>
  );
}
