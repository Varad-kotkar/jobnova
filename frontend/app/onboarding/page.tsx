"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { getApiUrl } from "@/lib/api";
import { CheckCircle2, ArrowRight, User, Briefcase, MapPin, DollarSign, Code, Sparkles } from "lucide-react";

export default function OnboardingPage() {
  const { user, token } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Profile Form State
  const [headline, setHeadline] = useState("Software Engineer");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("Remote");
  const [skillsInput, setSkillsInput] = useState("React, TypeScript, Python, FastAPI, SQL");
  const [preferredRoles, setPreferredRoles] = useState("Full Stack Engineer, Backend Developer");
  const [preferredLocations, setPreferredLocations] = useState("Remote, San Francisco, Bangalore");
  const [remotePreference, setRemotePreference] = useState(true);
  const [salaryExpectation, setSalaryExpectation] = useState("$120,000 - $160,000 USD");
  const [experienceYears, setExperienceYears] = useState(3);
  const [githubUrl, setGithubUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");

  const handleFinishOnboarding = async () => {
    setLoading(true);
    const apiBase = getApiUrl();
    const skillsArray = skillsInput.split(",").map((s) => s.trim()).filter(Boolean);
    const rolesArray = preferredRoles.split(",").map((r) => r.trim()).filter(Boolean);
    const locsArray = preferredLocations.split(",").map((l) => l.trim()).filter(Boolean);

    try {
      const res = await fetch(`${apiBase}/api/users/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          headline,
          bio,
          location,
          skills: skillsArray,
          preferred_roles: rolesArray,
          preferred_locations: locsArray,
          remote_preference: remotePreference,
          salary_expectation: salaryExpectation,
          experience_years: Number(experienceYears),
          github_url: githubUrl,
          linkedin_url: linkedinUrl,
          completion_percentage: 100,
          onboarding_completed: true,
        }),
      });

      if (res.ok) {
        router.push("/dashboard");
        router.refresh();
      } else {
        router.push("/dashboard");
      }
    } catch {
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const progressPercent = Math.round((step / 4) * 100);

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 flex items-center justify-center">
      <div className="w-full max-w-2xl bg-white rounded-3xl border border-slate-200 p-8 shadow-xl space-y-8">
        {/* Header */}
        <div className="space-y-3 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-200 px-3.5 py-1 text-xs font-bold text-blue-700">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Candidate Mandatory Onboarding
          </div>
          <h1 className="text-3xl font-extrabold text-slate-950 tracking-tight">
            Complete Your Candidate Profile
          </h1>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            JobNova requires a complete candidate profile to unlock AI match scoring, personalized 30-60-90 day career coaching, and 1-click job applications.
          </p>

          {/* Progress Bar */}
          <div className="pt-2">
            <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
              <span>Step {step} of 4</span>
              <span>{progressPercent}% Complete</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
        </div>

        {/* Step 1: Basic Info & Role */}
        {step === 1 && (
          <div className="space-y-5 animate-in fade-in">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" /> Basic Overview & Target Role
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Professional Headline</label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="e.g. Senior Full Stack Engineer"
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs font-medium text-slate-900 outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Current Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. San Francisco, CA or Remote"
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs font-medium text-slate-900 outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Years of Software Engineering Experience</label>
                <input
                  type="number"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(Number(e.target.value))}
                  min={0}
                  max={30}
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs font-medium text-slate-900 outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-bold text-white shadow-md hover:bg-blue-700 transition"
            >
              Continue to Technical Skills <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 2: Skills & Preferred Roles */}
        {step === 2 && (
          <div className="space-y-5 animate-in fade-in">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Code className="w-4 h-4 text-blue-600" /> Technical Skills & Role Preferences
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Tech Skills (Comma-separated)</label>
                <input
                  type="text"
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                  placeholder="e.g. React, TypeScript, Python, FastAPI, PostgreSQL, Docker"
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs font-medium text-slate-900 outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Engineering Roles</label>
                <input
                  type="text"
                  value={preferredRoles}
                  onChange={(e) => setPreferredRoles(e.target.value)}
                  placeholder="e.g. Full Stack Engineer, Backend Developer, AI Engineer"
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs font-medium text-slate-900 outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 rounded-xl border border-slate-200 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-bold text-white shadow-md hover:bg-blue-700 transition"
              >
                Continue to Work Preferences <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Location, Remote & Salary */}
        {step === 3 && (
          <div className="space-y-5 animate-in fade-in">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" /> Work Preferences & Salary Expectations
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Preferred Work Locations</label>
                <input
                  type="text"
                  value={preferredLocations}
                  onChange={(e) => setPreferredLocations(e.target.value)}
                  placeholder="e.g. Remote, San Francisco, New York, India"
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs font-medium text-slate-900 outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Annual Salary Expectation</label>
                <input
                  type="text"
                  value={salaryExpectation}
                  onChange={(e) => setSalaryExpectation(e.target.value)}
                  placeholder="e.g. $120,000 - $160,000 USD"
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs font-medium text-slate-900 outline-none focus:border-blue-600"
                />
              </div>

              <div className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50">
                <input
                  type="checkbox"
                  id="remoteCheck"
                  checked={remotePreference}
                  onChange={(e) => setRemotePreference(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600"
                />
                <label htmlFor="remoteCheck" className="text-xs font-semibold text-slate-800 cursor-pointer">
                  Prefer Remote Work / WFH Positions
                </label>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 rounded-xl border border-slate-200 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Back
              </button>
              <button
                onClick={() => setStep(4)}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-bold text-white shadow-md hover:bg-blue-700 transition"
              >
                Continue to Social Links <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Social Links & Final Submit */}
        {step === 4 && (
          <div className="space-y-5 animate-in fade-in">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-blue-600" /> Portfolio & Social Profiles
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">GitHub Profile URL</label>
                <input
                  type="url"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/yourusername"
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs font-medium text-slate-900 outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">LinkedIn Profile URL</label>
                <input
                  type="url"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/yourusername"
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs font-medium text-slate-900 outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setStep(3)}
                className="flex-1 rounded-xl border border-slate-200 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Back
              </button>
              <button
                onClick={handleFinishOnboarding}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-extrabold text-white shadow-md hover:bg-emerald-700 transition"
              >
                {loading ? "Finalizing Profile..." : "Complete Profile 100% ✓"}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
