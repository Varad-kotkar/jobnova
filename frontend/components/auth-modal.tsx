"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "signin" | "signup";
}

export default function AuthModal({
  isOpen,
  onClose,
  initialMode = "signin",
}: AuthModalProps) {
  const router = useRouter();
  const { signIn, signUp, signInWithGoogle, resetPassword, sendVerificationEmail } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">(initialMode);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"candidate" | "recruiter">("candidate");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (mode === "signin") {
        await signIn(email, password);
        onClose();
      } else if (mode === "signup") {
        await signUp(email, password, fullName || "Candidate", role);
        onClose();
        // Redirect new users to onboarding wizard
        router.push("/onboarding");
      } else if (mode === "forgot") {
        await resetPassword(email);
        setMessage("Password reset email sent! Please check your inbox.");
      }
    } catch (err: any) {
      setError(err?.message || "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError("");
    setMessage("");
    setLoading(true);
    try {
      await signInWithGoogle();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Google authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendVerification = async () => {
    setError("");
    setMessage("");
    try {
      await sendVerificationEmail();
      setMessage("Verification email sent to your address!");
    } catch (err: any) {
      setError(err?.message || "Failed to send verification email.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-popover space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 font-black text-white text-xs">
              JN
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">
                {mode === "signin" && "Sign In to JobNova"}
                {mode === "signup" && "Create Platform Account"}
                {mode === "forgot" && "Reset Password"}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
            {error}
          </div>
        )}

        {message && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-700">
            {message}
          </div>
        )}

        {/* Google OAuth Option */}
        {mode !== "forgot" && (
          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 rounded-xl border border-gray-200 bg-white py-2.5 text-xs font-bold text-gray-700 shadow-xs hover:bg-gray-50 transition disabled:opacity-50"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>
        )}

        {mode !== "forgot" && (
          <div className="flex items-center gap-3 my-2">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-[11px] font-semibold text-gray-400 uppercase">or</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div className="grid grid-cols-2 gap-2 mb-1">
              {(["candidate", "recruiter"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`rounded-xl border-2 py-2 text-xs font-bold transition ${
                    role === r
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {r === "candidate" ? "🎓 Job Seeker" : "💼 Recruiter"}
                </button>
              ))}
            </div>
          )}

          {mode === "signup" && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Candidate"
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:border-blue-600"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Work or Personal Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="candidate@example.com"
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:border-blue-600"
            />
          </div>

          {mode !== "forgot" && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-gray-700">Password</label>
                {mode === "signin" && (
                  <button
                    type="button"
                    onClick={() => setMode("forgot")}
                    className="text-[11px] font-semibold text-blue-600 hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:border-blue-600"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white shadow-subtle hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? "Processing..." : mode === "signin" ? "Sign In" : mode === "signup" ? "Create Account" : "Send Reset Instructions"}
          </button>
        </form>

        <div className="space-y-2 text-center text-xs text-gray-500 pt-2 border-t border-gray-100">
          {mode === "signin" ? (
            <div>
              Don't have an account?{" "}
              <button onClick={() => setMode("signup")} className="font-semibold text-blue-600 hover:underline">
                Sign Up
              </button>
            </div>
          ) : (
            <div>
              Already have an account?{" "}
              <button onClick={() => setMode("signin")} className="font-semibold text-blue-600 hover:underline">
                Sign In
              </button>
            </div>
          )}

          {email && (
            <div>
              <button
                type="button"
                onClick={handleSendVerification}
                className="text-[11px] text-gray-400 hover:text-blue-600 hover:underline"
              >
                Send Email Verification Link
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
