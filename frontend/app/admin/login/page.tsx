"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { ShieldCheck, Lock, Mail, AlertCircle } from "lucide-react";

export default function AdminLoginPage() {
  const { signIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorQuery = searchParams.get("error");

  const [email, setEmail] = useState("kotkarvarad12@gmail.com");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(
    errorQuery === "forbidden" ? "Access denied: Administrator privileges required." : null
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrMsg(null);

    try {
      await signIn(email, password);
      router.push("/admin/dashboard");
      router.refresh();
    } catch (err: any) {
      setErrMsg(err?.message || "Invalid administrator credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 font-black text-white text-2xl shadow-lg">
            JN
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">JobNova Administrator</h1>
          <p className="text-xs text-slate-400">Enterprise Administration Portal & System Controls</p>
        </div>

        {errMsg && (
          <div className="rounded-xl border border-rose-900/60 bg-rose-950/40 p-3 text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Admin Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-10 pr-3 py-3 text-xs font-medium text-white outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-10 pr-3 py-3 text-xs font-medium text-white outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-extrabold text-white shadow-lg hover:bg-blue-500 transition"
          >
            <ShieldCheck className="w-4 h-4" />
            {loading ? "Authenticating..." : "Sign In to Admin Portal"}
          </button>
        </form>

        <div className="border-t border-slate-800 pt-4 text-center">
          <span className="text-[11px] text-slate-500">Permanent Admin Account: kotkarvarad12@gmail.com</span>
        </div>
      </div>
    </main>
  );
}
