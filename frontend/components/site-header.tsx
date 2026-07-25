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
    { href: "/jobs?remote=true", label: "Remote" },
    { href: "/companies", label: "Companies" },
    { href: "/career-coach", label: "AI Career Coach" },
    { href: "/recruiter", label: "Employers" },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
          {/* Logo Mark */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white font-black text-sm shadow-subtle group-hover:bg-blue-700 transition">
              <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900">
              Job<span className="text-blue-600">Nova</span>
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
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                    isActive
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            {user && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setNotifMenuOpen(!notifMenuOpen)}
                  className="relative rounded-lg border border-gray-200 bg-white p-2 text-gray-600 hover:bg-gray-50 transition"
                  title="Notifications"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {notifMenuOpen && (
                  <div
                    onMouseLeave={() => setNotifMenuOpen(false)}
                    className="absolute right-0 mt-2 w-80 rounded-2xl border border-gray-200 bg-white p-4 shadow-popover z-50 space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                      <span className="text-xs font-bold text-gray-900">Notifications</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-[11px] font-semibold text-blue-600 hover:underline"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div className="max-h-64 overflow-y-auto space-y-2 divide-y divide-gray-100">
                      {notifications.length > 0 ? (
                        notifications.map((n) => (
                          <div key={n.id} className="pt-2 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-gray-900">{n.title}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${n.priority === "High" ? "bg-rose-50 text-rose-700" : "bg-gray-100 text-gray-700"}`}>
                                {n.priority}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-500 mt-1">{n.message}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-gray-500 py-4 text-center">No unread notifications.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Saved Jobs Badge */}
            <Link
              href="/dashboard?tab=saved"
              className="relative flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
            >
              <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              <span className="hidden sm:inline">Saved</span>
              {savedCount > 0 && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-gray-900 text-[10px] font-bold text-white">
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
                  className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-1 pr-3 text-xs font-semibold text-gray-800 shadow-subtle hover:border-gray-300 transition"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-600 font-bold text-white uppercase text-[11px]">
                    {(user.full_name || user.email || "U").charAt(0)}
                  </div>
                  <span className="max-w-[100px] truncate font-medium">
                    {user.full_name || user.email?.split("@")[0]}
                  </span>
                  <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {userMenuOpen && (
                  <div
                    onMouseLeave={() => setUserMenuOpen(false)}
                    className="absolute right-0 mt-2 w-56 rounded-2xl border border-gray-200 bg-white p-2 shadow-popover z-50"
                  >
                    <div className="px-3 py-2 border-b border-gray-100 mb-1">
                      <p className="text-xs font-bold text-gray-900 truncate">{user.full_name || "User"}</p>
                      <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
                    </div>
                    <Link
                      href="/dashboard"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition"
                    >
                      Candidate Dashboard
                    </Link>
                    <Link
                      href="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition"
                    >
                      My Profile & Resume
                    </Link>
                    <Link
                      href="/recruiter"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition"
                    >
                      Recruiter Portal
                    </Link>
                    <div className="border-t border-gray-100 my-1 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false);
                          logout();
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition"
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
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => openAuth("signup")}
                  className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-subtle hover:bg-blue-700 transition"
                >
                  Get Started
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
