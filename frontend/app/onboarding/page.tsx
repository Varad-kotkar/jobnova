"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/context/auth-context";
import { getApiUrl } from "@/lib/api";
import { LOGO, LOGO_ALT } from "@/lib/logo";
import {
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  User,
  MapPin,
  GraduationCap,
  Code,
  Link2,
  Sparkles,
  Upload,
  FileText,
  Lock,
  Unlock,
} from "lucide-react";

const TOTAL_STEPS = 6;

export default function OnboardingPage() {
  const { token } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [error, setError] = useState("");
  const [resumeSuccess, setResumeSuccess] = useState("");

  // Step 1: Resume File
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  // Step 2: Personal Information
  const [headline, setHeadline] = useState("");
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [experienceYears, setExperienceYears] = useState<number | "">("");

  // Step 3: Education
  const [educationEntries, setEducationEntries] = useState([
    { degree: "", institution: "", year: "", field: "" },
  ]);

  // Step 4: Skills & Roles
  const [skillsInput, setSkillsInput] = useState("");
  const [preferredRoles, setPreferredRoles] = useState("");
  const [careerGoal, setCareerGoal] = useState("");

  // Step 5: Work Preferences
  const [preferredLocations, setPreferredLocations] = useState("");
  const [salaryExpectation, setSalaryExpectation] = useState("");
  const [remotePreference, setRemotePreference] = useState(true);
  const [availability, setAvailability] = useState("");
  const [workAuthorization, setWorkAuthorization] = useState("");

  // Step 6: Links & Portfolio
  const [githubUrl, setGithubUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [bio, setBio] = useState("");

  // Redirect if not logged in
  useEffect(() => {
    if (!token && typeof window !== "undefined") {
      router.push("/login");
    }
  }, [token, router]);

  const handleResumeUpload = async (file: File) => {
    if (!token) return;
    setUploadingResume(true);
    setError("");
    setResumeSuccess("");

    try {
      const apiBase = getApiUrl();
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${apiBase}/api/users/resume/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setResumeSuccess(`Parsed "${file.name}" successfully! Profile pre-filled.`);
        if (data.parsed_fields) {
          if (data.parsed_fields.headline && !headline) setHeadline(data.parsed_fields.headline);
          if (data.parsed_fields.phone && !phone) setPhone(data.parsed_fields.phone);
          if (data.parsed_fields.github_url && !githubUrl) setGithubUrl(data.parsed_fields.github_url);
          if (data.parsed_fields.linkedin_url && !linkedinUrl) setLinkedinUrl(data.parsed_fields.linkedin_url);
          if (data.parsed_fields.skills?.length > 0 && !skillsInput) {
            setSkillsInput(data.parsed_fields.skills.join(", "));
          }
        }
      } else {
        setError("Failed to parse resume. You can still fill out the profile manually.");
      }
    } catch {
      setError("Network error uploading resume. You can continue manually.");
    } finally {
      setUploadingResume(false);
    }
  };

  const updateEducation = (index: number, field: string, value: string) => {
    const updated = [...educationEntries];
    (updated[index] as any)[field] = value;
    setEducationEntries(updated);
  };

  const addEducationEntry = () => {
    setEducationEntries([
      ...educationEntries,
      { degree: "", institution: "", year: "", field: "" },
    ]);
  };

  const canProceed = (s: number): boolean => {
    switch (s) {
      case 1:
        return true; // Resume is optional
      case 2:
        return headline.trim().length > 0 && location.trim().length > 0;
      case 3:
        return true; // Education is optional
      case 4:
        return skillsInput.trim().length > 0;
      case 5:
        return true; // Preferences are optional
      case 6:
        return true; // Links & bio optional
      default:
        return true;
    }
  };

  const handleFinishOnboarding = async () => {
    setLoading(true);
    setError("");
    const apiBase = getApiUrl();
    const skillsArray = skillsInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const rolesArray = preferredRoles
      .split(",")
      .map((r) => r.trim())
      .filter(Boolean);
    const locsArray = preferredLocations
      .split(",")
      .map((l) => l.trim())
      .filter(Boolean);

    const validEducation = educationEntries.filter(
      (e) => e.degree.trim() || e.institution.trim()
    );

    try {
      const res = await fetch(`${apiBase}/api/users/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          headline: headline.trim(),
          bio: bio.trim(),
          location: location.trim(),
          phone: phone.trim(),
          skills: skillsArray,
          education: validEducation,
          career_goal: careerGoal.trim(),
          preferred_roles: rolesArray,
          preferred_locations: locsArray,
          remote_preference: remotePreference,
          salary_expectation: salaryExpectation.trim(),
          experience_years: experienceYears !== "" ? Number(experienceYears) : null,
          availability: availability,
          work_authorization: workAuthorization,
          github_url: githubUrl.trim(),
          linkedin_url: linkedinUrl.trim(),
          portfolio_url: portfolioUrl.trim(),
          onboarding_completed: true,
        }),
      });

      if (res.ok) {
        router.push("/dashboard");
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.detail || "Failed to save profile. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const progressPercent = Math.round((step / TOTAL_STEPS) * 100);

  const stepIcons = [
    <FileText key="ft" className="w-4 h-4" />,
    <User key="u" className="w-4 h-4" />,
    <GraduationCap key="g" className="w-4 h-4" />,
    <Code key="c" className="w-4 h-4" />,
    <MapPin key="m" className="w-4 h-4" />,
    <CheckCircle2 key="ch" className="w-4 h-4" />,
  ];

  const stepLabels = [
    "Resume",
    "Personal",
    "Education",
    "Skills",
    "Preferences",
    "Complete",
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-10 px-4 sm:px-6 flex items-start justify-center">
      <div className="w-full max-w-2xl bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xl space-y-7">
        {/* Header */}
        <div className="space-y-4 text-center">
          <Image
            src={LOGO.lettermark}
            alt={LOGO_ALT.lettermark}
            width={44}
            height={44}
            className="h-11 w-11 mx-auto rounded-xl shadow-sm"
          />
          <div>
            <h1 className="text-2xl font-extrabold text-slate-950 tracking-tight">
              Complete Your Profile
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Fill in your details to unlock AI career roadmaps, job recommendations, and ATS analysis.
            </p>
          </div>

          {/* Unlocked Features Banner */}
          <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-3 flex items-center justify-around text-[11px] font-bold text-slate-700">
            <div className="flex items-center gap-1.5">
              {progressPercent >= 40 ? (
                <Unlock className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span className={progressPercent >= 40 ? "text-emerald-700" : "text-slate-500"}>
                Recommendations (40%)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {progressPercent >= 70 ? (
                <Unlock className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span className={progressPercent >= 70 ? "text-emerald-700" : "text-slate-500"}>
                ATS Analyzer (70%)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {progressPercent >= 100 ? (
                <Unlock className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span className={progressPercent >= 100 ? "text-emerald-700" : "text-slate-500"}>
                AI Roadmap (100%)
              </span>
            </div>
          </div>

          {/* Step indicators */}
          <div className="flex items-center justify-center gap-1 pt-1">
            {stepLabels.map((label, i) => (
              <button
                key={label}
                onClick={() => {
                  if (i + 1 < step || canProceed(step)) setStep(i + 1);
                }}
                className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold transition ${
                  step === i + 1
                    ? "bg-blue-600 text-white"
                    : step > i + 1
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {stepIcons[i]}
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
              <span>
                Step {step} of {TOTAL_STEPS}
              </span>
              <span>{progressPercent}% Complete</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-2.5 text-xs font-semibold text-rose-700">
            {error}
          </div>
        )}

        {resumeSuccess && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-xs font-semibold text-emerald-700">
            {resumeSuccess}
          </div>
        )}

        {/* Step 1: Resume Upload */}
        {step === 1 && (
          <div className="space-y-5 animate-in fade-in">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Upload className="w-4 h-4 text-blue-600" /> Resume Upload & Auto-fill (Optional)
            </h2>
            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-blue-500 transition bg-slate-50/50 space-y-3">
              <Upload className="w-8 h-8 text-blue-600 mx-auto" />
              <div>
                <p className="text-xs font-bold text-slate-800">
                  Upload your Resume (PDF, DOCX, or TXT)
                </p>
                <p className="text-[11px] text-slate-500">
                  Our AI parser will automatically extract your skills, education, and contact details.
                </p>
              </div>
              <input
                type="file"
                accept=".pdf,.docx,.doc,.txt"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    setResumeFile(e.target.files[0]);
                    handleResumeUpload(e.target.files[0]);
                  }
                }}
                className="hidden"
                id="resumeUploadInput"
              />
              <label
                htmlFor="resumeUploadInput"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 cursor-pointer transition"
              >
                {uploadingResume ? "Extracting Profile Details..." : "Select Resume File"}
              </label>
              {resumeFile && (
                <p className="text-[11px] font-semibold text-slate-600 mt-2">
                  Selected: {resumeFile.name}
                </p>
              )}
            </div>
            <div className="text-center">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 underline"
              >
                Skip resume upload and enter details manually →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Personal Information */}
        {step === 2 && (
          <div className="space-y-5 animate-in fade-in">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" /> Personal Information
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Professional Headline *
                </label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="e.g. Full Stack Engineer"
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs font-medium text-slate-900 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Current Location *
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Pune, India / San Francisco, CA"
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs font-medium text-slate-900 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +1 555-0199 or +91 9876543210"
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs font-medium text-slate-900 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Years of Experience
                </label>
                <input
                  type="number"
                  value={experienceYears}
                  onChange={(e) =>
                    setExperienceYears(
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                  min={0}
                  max={40}
                  placeholder="e.g. 3"
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs font-medium text-slate-900 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Education */}
        {step === 3 && (
          <div className="space-y-5 animate-in fade-in">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-blue-600" /> Education
            </h2>
            {educationEntries.map((entry, idx) => (
              <div
                key={idx}
                className="grid gap-3 sm:grid-cols-2 p-4 rounded-xl border border-slate-100 bg-slate-50/50"
              >
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Degree
                  </label>
                  <input
                    type="text"
                    value={entry.degree}
                    onChange={(e) =>
                      updateEducation(idx, "degree", e.target.value)
                    }
                    placeholder="e.g. B.Tech / B.S. CS"
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium text-slate-900 outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Institution
                  </label>
                  <input
                    type="text"
                    value={entry.institution}
                    onChange={(e) =>
                      updateEducation(idx, "institution", e.target.value)
                    }
                    placeholder="e.g. University Name"
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium text-slate-900 outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Field of Study
                  </label>
                  <input
                    type="text"
                    value={entry.field}
                    onChange={(e) =>
                      updateEducation(idx, "field", e.target.value)
                    }
                    placeholder="e.g. Computer Science"
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium text-slate-900 outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Graduation Year
                  </label>
                  <input
                    type="text"
                    value={entry.year}
                    onChange={(e) =>
                      updateEducation(idx, "year", e.target.value)
                    }
                    placeholder="e.g. 2024"
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium text-slate-900 outline-none focus:border-blue-600"
                  />
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addEducationEntry}
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              + Add Another Education
            </button>
          </div>
        )}

        {/* Step 4: Skills & Career Goals */}
        {step === 4 && (
          <div className="space-y-5 animate-in fade-in">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Code className="w-4 h-4 text-blue-600" /> Skills & Career Goals
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Technical Skills * (comma-separated)
                </label>
                <input
                  type="text"
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                  placeholder="e.g. Python, React, PostgreSQL, Docker"
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs font-medium text-slate-900 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Roles (comma-separated)
                </label>
                <input
                  type="text"
                  value={preferredRoles}
                  onChange={(e) => setPreferredRoles(e.target.value)}
                  placeholder="e.g. Backend Engineer, Data Scientist"
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs font-medium text-slate-900 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Career Goal
                </label>
                <input
                  type="text"
                  value={careerGoal}
                  onChange={(e) => setCareerGoal(e.target.value)}
                  placeholder="e.g. Transition into Senior AI/ML Engineering"
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs font-medium text-slate-900 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Work Preferences */}
        {step === 5 && (
          <div className="space-y-5 animate-in fade-in">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" /> Work Preferences
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Preferred Locations (comma-separated)
                </label>
                <input
                  type="text"
                  value={preferredLocations}
                  onChange={(e) => setPreferredLocations(e.target.value)}
                  placeholder="e.g. Remote, San Francisco, New York, London"
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs font-medium text-slate-900 outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Salary Expectation
                </label>
                <input
                  type="text"
                  value={salaryExpectation}
                  onChange={(e) => setSalaryExpectation(e.target.value)}
                  placeholder="e.g. $80,000 - $120,000 / year"
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs font-medium text-slate-900 outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Availability
                </label>
                <select
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs font-medium text-slate-900 outline-none focus:border-blue-600 bg-white"
                >
                  <option value="">Select...</option>
                  <option value="Immediately">Immediately</option>
                  <option value="2 Weeks">2 Weeks</option>
                  <option value="1 Month">1 Month</option>
                  <option value="2 Months">2 Months</option>
                  <option value="3+ Months">3+ Months</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Work Authorization
                </label>
                <select
                  value={workAuthorization}
                  onChange={(e) => setWorkAuthorization(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs font-medium text-slate-900 outline-none focus:border-blue-600 bg-white"
                >
                  <option value="">Select...</option>
                  <option value="Citizen">Citizen</option>
                  <option value="Permanent Resident">Permanent Resident</option>
                  <option value="Work Visa">Work Visa</option>
                  <option value="Visa Required">Visa Sponsorship Required</option>
                  <option value="Student Visa">Student Visa (OPT/CPT)</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50">
              <input
                type="checkbox"
                id="remoteCheck"
                checked={remotePreference}
                onChange={(e) => setRemotePreference(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
              />
              <label
                htmlFor="remoteCheck"
                className="text-xs font-semibold text-slate-800 cursor-pointer"
              >
                Prefer Remote / Work From Home positions
              </label>
            </div>
          </div>
        )}

        {/* Step 6: Review & Complete */}
        {step === 6 && (
          <div className="space-y-5 animate-in fade-in">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" /> Portfolio, Links & Final Review
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  GitHub
                </label>
                <input
                  type="url"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/username"
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs font-medium text-slate-900 outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  LinkedIn
                </label>
                <input
                  type="url"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/username"
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs font-medium text-slate-900 outline-none focus:border-blue-600"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Portfolio Website
                </label>
                <input
                  type="url"
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  placeholder="https://yourportfolio.com"
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs font-medium text-slate-900 outline-none focus:border-blue-600"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Short Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell employers about yourself in 2-3 sentences..."
                rows={2}
                className="w-full rounded-xl border border-slate-200 p-3 text-xs font-medium text-slate-900 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 resize-none"
              />
            </div>

            {/* Profile Summary Card */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-3 text-xs">
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <span className="font-bold text-slate-500">Headline:</span>{" "}
                  <span className="font-semibold text-slate-900">{headline || "—"}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-500">Location:</span>{" "}
                  <span className="font-semibold text-slate-900">{location || "—"}</span>
                </div>
              </div>
              {skillsInput && (
                <div>
                  <span className="font-bold text-slate-500">Skills:</span>{" "}
                  <span className="font-semibold text-blue-700">{skillsInput}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-3 pt-1">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          )}
          {step < TOTAL_STEPS ? (
            <button
              onClick={() => {
                if (canProceed(step)) setStep(step + 1);
              }}
              disabled={!canProceed(step)}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-bold text-white shadow-md hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleFinishOnboarding}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-extrabold text-white shadow-md hover:bg-emerald-700 transition disabled:opacity-50"
            >
              {loading ? (
                "Saving Profile..."
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Complete Profile & Unlock Platform
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
