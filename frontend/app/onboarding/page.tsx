"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { getApiUrl } from "@/lib/api";

type OnboardingStep = 1 | 2 | 3 | 4 | 5;

const STEP_LABELS = [
  "Your Role",
  "Skills & Experience",
  "Preferences",
  "Upload Resume",
  "You're All Set!",
];

const POPULAR_SKILLS = [
  "Python", "JavaScript", "TypeScript", "React", "Node.js", "FastAPI", "Django",
  "SQL", "PostgreSQL", "MongoDB", "Docker", "Kubernetes", "AWS", "GCP", "Azure",
  "Machine Learning", "Data Analysis", "TensorFlow", "PyTorch", "Pandas",
  "Java", "Spring Boot", "Go", "Rust", "C++", "Swift", "Flutter",
  "GraphQL", "REST APIs", "Redis", "Kafka", "Terraform", "CI/CD",
];

const JOB_TYPES = ["Full Time", "Part Time", "Contract", "Internship", "Freelance"];
const REMOTE_OPTIONS = [
  { value: "remote", label: "🏠 Remote Only", desc: "Work from anywhere" },
  { value: "hybrid", label: "🏢 Hybrid", desc: "Mix of remote and office" },
  { value: "onsite", label: "🏙️ On-site", desc: "In office full-time" },
  { value: "any", label: "✨ Any", desc: "Open to all work styles" },
];
const SALARY_OPTIONS = [
  "Under ₹5 LPA", "₹5–10 LPA", "₹10–20 LPA", "₹20–30 LPA", "₹30–50 LPA", "₹50+ LPA",
  "Under $50K", "$50–80K", "$80–120K", "$120–160K", "$160K+",
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, token, loading } = useAuth();

  const [step, setStep] = useState<OnboardingStep>(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Step 1 — Role
  const [role, setRole] = useState<"candidate" | "recruiter">("candidate");
  const [headline, setHeadline] = useState("");

  // Step 2 — Skills & Experience
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [customSkill, setCustomSkill] = useState("");
  const [experienceYears, setExperienceYears] = useState<number>(0);

  // Step 3 — Preferences
  const [preferredRoles, setPreferredRoles] = useState<string>("");
  const [preferredLocations, setPreferredLocations] = useState<string>("");
  const [remotePreference, setRemotePreference] = useState<string>("any");
  const [salaryExpectation, setSalaryExpectation] = useState("");
  const [availability, setAvailability] = useState("Immediately");
  const [selectedJobTypes, setSelectedJobTypes] = useState<string[]>(["Full Time"]);

  // Step 4 — Resume (optional)
  const [resumeUrl, setResumeUrl] = useState("");
  const [skipResume, setSkipResume] = useState(false);

  // Redirect already-onboarded or non-auth users
  useEffect(() => {
    if (!loading) {
      if (!user || !token) {
        router.replace("/");
        return;
      }
      const onboarded = (user as any)?.profile?.onboarding_completed;
      if (onboarded) {
        router.replace("/dashboard");
      }
    }
  }, [user, token, loading, router]);

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const addCustomSkill = () => {
    const sk = customSkill.trim();
    if (sk && !selectedSkills.includes(sk)) {
      setSelectedSkills((prev) => [...prev, sk]);
    }
    setCustomSkill("");
  };

  const toggleJobType = (jt: string) => {
    setSelectedJobTypes((prev) =>
      prev.includes(jt) ? prev.filter((t) => t !== jt) : [...prev, jt]
    );
  };

  const handleNext = () => {
    setError("");
    if (step === 1 && !headline.trim()) {
      setError("Please enter a professional headline.");
      return;
    }
    if (step === 2 && selectedSkills.length === 0) {
      setError("Please select at least one skill.");
      return;
    }
    if (step < 5) setStep((s) => (s + 1) as OnboardingStep);
  };

  const handleBack = () => {
    if (step > 1) setStep((s) => (s - 1) as OnboardingStep);
  };

  const handleFinish = async () => {
    setSaving(true);
    setError("");
    try {
      const apiBase = getApiUrl();
      const payload = {
        headline,
        skills: selectedSkills,
        experience_years: experienceYears,
        preferred_roles: preferredRoles
          .split(",")
          .map((r) => r.trim())
          .filter(Boolean),
        preferred_locations: preferredLocations
          .split(",")
          .map((l) => l.trim())
          .filter(Boolean),
        remote_preference: remotePreference !== "any",
        salary_expectation: salaryExpectation,
        availability,
        resume_url: resumeUrl || null,
        onboarding_completed: true,
      };

      const res = await fetch(`${apiBase}/api/users/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Failed to save profile. Please try again.");
      }

      setStep(5);
    } catch (err: any) {
      setError(err.message || "Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  const progress = ((step - 1) / (STEP_LABELS.length - 1)) * 100;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-blue-600 text-white font-black text-lg shadow-lg mb-4">
            JN
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">Welcome to JobNova</h1>
          <p className="text-sm text-slate-500 mt-1">
            {user.full_name ? `Hi ${user.full_name.split(" ")[0]}! ` : ""}
            Let's set up your profile in 2 minutes.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-xs font-semibold text-slate-400 mb-2">
            <span>Step {step} of {STEP_LABELS.length}</span>
            <span>{STEP_LABELS[step - 1]}</span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8">
          {error && (
            <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-700">
              {error}
            </div>
          )}

          {/* STEP 1 — Role & Headline */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-1">What describes you best?</h2>
                <p className="text-xs text-slate-500">This helps us personalize your experience.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: "candidate", label: "🎓 Job Seeker", desc: "Looking for opportunities" },
                  { value: "recruiter", label: "💼 Recruiter", desc: "Hiring for my company" },
                ].map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setRole(r.value as any)}
                    className={`rounded-2xl border-2 p-4 text-left transition ${
                      role === r.value
                        ? "border-blue-600 bg-blue-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <p className="text-lg mb-1">{r.label.split(" ")[0]}</p>
                    <p className="text-xs font-bold text-slate-800">{r.label.substring(2)}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{r.desc}</p>
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Professional Headline
                </label>
                <input
                  type="text"
                  placeholder="e.g. Senior Python Developer | 5 years exp | Open to Remote"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-600 transition"
                />
              </div>
            </div>
          )}

          {/* STEP 2 — Skills */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-1">What are your top skills?</h2>
                <p className="text-xs text-slate-500">Select all that apply. This powers your job recommendations.</p>
              </div>

              <div className="flex flex-wrap gap-2 max-h-52 overflow-y-auto">
                {POPULAR_SKILLS.map((skill) => (
                  <button
                    key={skill}
                    onClick={() => toggleSkill(skill)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                      selectedSkills.includes(skill)
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add a custom skill..."
                  value={customSkill}
                  onChange={(e) => setCustomSkill(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addCustomSkill()}
                  className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-600"
                />
                <button
                  onClick={addCustomSkill}
                  className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-700 transition"
                >
                  Add
                </button>
              </div>

              {selectedSkills.length > 0 && (
                <p className="text-xs text-emerald-600 font-semibold">
                  ✓ {selectedSkills.length} skill{selectedSkills.length !== 1 ? "s" : ""} selected
                </p>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Years of Experience
                </label>
                <select
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-600"
                >
                  <option value={0}>Fresher / No experience</option>
                  <option value={1}>1 year</option>
                  <option value={2}>2 years</option>
                  <option value={3}>3 years</option>
                  <option value={5}>5 years</option>
                  <option value={7}>7+ years</option>
                  <option value={10}>10+ years</option>
                </select>
              </div>
            </div>
          )}

          {/* STEP 3 — Preferences */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-1">Job Preferences</h2>
                <p className="text-xs text-slate-500">Customize what jobs we show you.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Work Style
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {REMOTE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setRemotePreference(opt.value)}
                      className={`rounded-xl border-2 p-3 text-left transition ${
                        remotePreference === opt.value
                          ? "border-blue-600 bg-blue-50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <p className="text-xs font-bold text-slate-800">{opt.label}</p>
                      <p className="text-[10px] text-slate-500">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Job Types
                </label>
                <div className="flex flex-wrap gap-2">
                  {JOB_TYPES.map((jt) => (
                    <button
                      key={jt}
                      onClick={() => toggleJobType(jt)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                        selectedJobTypes.includes(jt)
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {jt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Expected Salary
                </label>
                <select
                  value={salaryExpectation}
                  onChange={(e) => setSalaryExpectation(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-600"
                >
                  <option value="">Select range (optional)</option>
                  {SALARY_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Preferred Locations (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bangalore, Mumbai, Remote, USA"
                  value={preferredLocations}
                  onChange={(e) => setPreferredLocations(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Availability
                </label>
                <select
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-600"
                >
                  <option>Immediately</option>
                  <option>2 weeks notice</option>
                  <option>1 month notice</option>
                  <option>2 months notice</option>
                  <option>Not actively looking</option>
                </select>
              </div>
            </div>
          )}

          {/* STEP 4 — Resume */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-1">Upload Your Resume</h2>
                <p className="text-xs text-slate-500">Recruiters and AI features need your resume for best results.</p>
              </div>

              <div className="rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/50 p-8 text-center">
                <p className="text-3xl mb-3">📄</p>
                <p className="text-sm font-bold text-slate-700 mb-1">Resume Upload</p>
                <p className="text-xs text-slate-500 mb-4">PDF, DOCX up to 5MB. Feature coming with file storage.</p>
                <input
                  type="url"
                  placeholder="Or paste a Google Drive / Dropbox link..."
                  value={resumeUrl}
                  onChange={(e) => setResumeUrl(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-blue-600"
                />
              </div>

              <button
                onClick={() => setSkipResume(true)}
                className="text-xs text-slate-400 hover:text-slate-600 underline w-full text-center"
              >
                Skip for now — I'll add it later
              </button>
            </div>
          )}

          {/* STEP 5 — Complete */}
          {step === 5 && (
            <div className="text-center space-y-6 py-4">
              <div className="text-6xl">🎉</div>
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 mb-2">You're all set!</h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Your profile is live. We've found personalized job recommendations based on your skills.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-2xl bg-blue-50 border border-blue-100 p-4">
                  <p className="text-2xl font-black text-blue-700 mb-1">{selectedSkills.length}</p>
                  <p className="font-semibold text-blue-800">Skills Added</p>
                </div>
                <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4">
                  <p className="text-2xl font-black text-emerald-700 mb-1">Ready</p>
                  <p className="font-semibold text-emerald-800">For Job Match</p>
                </div>
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => router.replace("/dashboard")}
                  className="w-full rounded-2xl bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-700 transition"
                >
                  Go to My Dashboard →
                </button>
                <button
                  onClick={() => router.replace("/jobs")}
                  className="w-full rounded-2xl border border-slate-200 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Browse Recommended Jobs
                </button>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          {step < 5 && (
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
              <button
                onClick={handleBack}
                disabled={step === 1}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition disabled:opacity-30"
              >
                ← Back
              </button>

              {step < 4 ? (
                <button
                  onClick={handleNext}
                  className="rounded-2xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition"
                >
                  Continue →
                </button>
              ) : (
                <button
                  onClick={handleFinish}
                  disabled={saving}
                  className="rounded-2xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Complete Setup ✓"}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Skip Onboarding Link */}
        {step < 5 && (
          <p className="text-center mt-4 text-xs text-slate-400">
            <button
              onClick={async () => {
                // Mark as completed even if skipped
                try {
                  await fetch(`${getApiUrl()}/api/users/profile`, {
                    method: "PATCH",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ onboarding_completed: true }),
                  });
                } catch {}
                router.replace("/dashboard");
              }}
              className="hover:text-slate-600 underline transition"
            >
              Skip onboarding, take me to the dashboard
            </button>
          </p>
        )}
      </div>
    </main>
  );
}
