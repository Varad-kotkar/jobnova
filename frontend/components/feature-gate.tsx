"use client";

import React from "react";
import Link from "next/link";
import { Lock, Sparkles, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/auth-context";

interface FeatureGateProps {
  requiredCompletion?: number;
  featureName: string;
  featureDescription?: string;
  children: React.ReactNode;
}

export default function FeatureGate({
  requiredCompletion = 50,
  featureName,
  featureDescription = "Complete your candidate profile to unlock AI-powered insights, recommendations, and tools.",
  children,
}: FeatureGateProps) {
  const { user, token } = useAuth();

  if (!token || !user) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-8 sm:p-12 text-center max-w-xl mx-auto my-8 shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto mb-4 text-blue-600">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Authentication Required</h2>
        <p className="text-xs text-slate-500 mb-6">{featureDescription}</p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-xs font-bold text-white shadow-md hover:bg-blue-700 transition"
        >
          Sign In to Access {featureName} <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const profile = user.profile || {};
  const completion = profile.completion_percentage || (profile.onboarding_completed ? 100 : 15);

  if (completion < requiredCompletion && !profile.onboarding_completed) {
    return (
      <div className="rounded-3xl border border-blue-100 bg-gradient-to-b from-blue-50/40 to-white p-8 sm:p-12 text-center max-w-xl mx-auto my-8 shadow-md">
        <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto mb-4 shadow-sm">
          <Sparkles className="w-6 h-6" />
        </div>
        <div className="inline-block rounded-full bg-blue-100 px-3 py-1 text-[11px] font-bold text-blue-800 mb-3">
          Feature Locked • {completion}% Completed
        </div>
        <h2 className="text-xl font-extrabold text-slate-950 mb-2">
          Unlock {featureName}
        </h2>
        <p className="text-xs text-slate-600 mb-6 max-w-md mx-auto">
          {featureDescription} (Requires at least {requiredCompletion}% profile completion).
        </p>
        <div className="w-full bg-slate-100 rounded-full h-2 max-w-xs mx-auto mb-6 overflow-hidden">
          <div
            className="bg-blue-600 h-full transition-all duration-500 rounded-full"
            style={{ width: `${completion}%` }}
          />
        </div>
        <Link
          href="/onboarding"
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-xs font-bold text-white shadow-md hover:bg-blue-700 transition"
        >
          Complete Your Profile Now <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
