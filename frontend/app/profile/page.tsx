"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getApiUrl } from "@/lib/api";
import { getUserProfile, saveUserProfile, UserProfileData } from "@/lib/storage";

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfileData>(getUserProfile());
  const [newSkill, setNewSkill] = useState("");
  const [savedNotice, setSavedNotice] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [parsedSkills, setParsedSkills] = useState<string[]>([]);
  const [resumeVersion, setResumeVersion] = useState<number | null>(null);

  useEffect(() => {
    setProfile(getUserProfile());

    // Fetch primary resume version from API if token exists
    const token = localStorage.getItem("jobnova_token");
    if (token && token !== "demo-jwt-token") {
      const apiBase = getApiUrl();
      fetch(`${apiBase}/api/users/resume/primary`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) {
            setResumeVersion(data.version);
            setParsedSkills(data.extracted_skills || []);
          }
        })
        .catch((err) => console.warn("Primary resume fetch warning:", err));
    }
  }, []);

  const handleChange = (field: keyof UserProfileData, value: any) => {
    const updated = { ...profile, [field]: value };
    setProfile(updated);
    saveUserProfile(updated);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setUploading(true);

    const token = localStorage.getItem("jobnova_token");
    if (token && token !== "demo-jwt-token") {
      const apiBase = getApiUrl();
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch(`${apiBase}/api/users/resume/upload`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          setResumeVersion(data.version);
          setParsedSkills(data.extracted_skills || []);
          
          // Merge newly extracted skills with profile
          const combinedSkills = Array.from(new Set([...profile.skills, ...(data.extracted_skills || [])]));
          handleChange("resumeFileName", file.name);
          handleChange("skills", combinedSkills);
        }
      } catch (err) {
        console.warn("Resume upload API warning:", err);
      } finally {
        setUploading(false);
      }
    } else {
      handleChange("resumeFileName", file.name);
      setUploading(false);
    }
  };

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkill.trim()) return;
    if (!profile.skills.includes(newSkill.trim())) {
      const updatedSkills = [...profile.skills, newSkill.trim()];
      handleChange("skills", updatedSkills);
    }
    setNewSkill("");
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    const updatedSkills = profile.skills.filter((s) => s !== skillToRemove);
    handleChange("skills", updatedSkills);
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      {/* Top Bar */}
      <div className="mb-8 flex items-center justify-between border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-950">Candidate Profile</h1>
          <p className="mt-1 text-sm text-slate-600">
            Keep your profile and resume updated to match top engineering opportunities.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-card hover:bg-slate-50 transition"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {savedNotice && (
        <div className="mb-6 rounded-2xl bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 border border-emerald-200 animate-in fade-in">
          Profile changes saved automatically ✓
        </div>
      )}

      {/* Completion Bar */}
      <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Profile Strength
          </span>
          <span className="text-sm font-extrabold text-slate-950">
            {profile.completionPercentage}% Complete
          </span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full bg-indigo-600 transition-all duration-500"
            style={{ width: `${profile.completionPercentage}%` }}
          />
        </div>
      </div>

      <div className="space-y-8">
        {/* Personal Details Card */}
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-card space-y-6">
          <h2 className="text-xl font-bold text-slate-950">Personal Details</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-slate-950"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-slate-950"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Professional Headline
              </label>
              <input
                type="text"
                value={profile.headline}
                onChange={(e) => handleChange("headline", e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-slate-950"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Location
              </label>
              <input
                type="text"
                value={profile.location}
                onChange={(e) => handleChange("location", e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-slate-950"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Short Bio
            </label>
            <textarea
              rows={3}
              value={profile.bio}
              onChange={(e) => handleChange("bio", e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-4 text-sm text-slate-900 outline-none focus:border-slate-950"
            />
          </div>
        </section>

        {/* Resume Dropzone & Versioning */}
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-950">Resume / CV</h2>
            {resumeVersion && (
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 border border-indigo-100">
                Version {resumeVersion} Primary
              </span>
            )}
          </div>

          <label className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/50 p-8 text-center hover:bg-slate-50 transition cursor-pointer">
            <input
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
            <svg className="h-10 w-10 text-slate-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-sm font-semibold text-slate-900">
              {uploading ? "Parsing resume..." : <>Attached: <span className="text-indigo-600 underline">{profile.resumeFileName}</span></>}
            </p>
            <p className="text-xs text-slate-400 mt-1">Click to upload a new PDF or DOCX file. Skills will be extracted automatically.</p>
          </label>
        </section>

        {/* Skills Tag Editor */}
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-card space-y-6">
          <h2 className="text-xl font-bold text-slate-950">Skills & Technologies</h2>
          <form onSubmit={handleAddSkill} className="flex gap-2">
            <input
              type="text"
              placeholder="Add skill (e.g. Next.js, GraphQL, PyTorch)..."
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-950"
            />
            <button
              type="submit"
              className="rounded-xl bg-slate-950 px-5 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-slate-800 transition"
            >
              Add Skill
            </button>
          </form>

          <div className="flex flex-wrap gap-2">
            {profile.skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3.5 py-1.5 text-xs font-semibold text-slate-800 border border-slate-200"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill)}
                  className="text-slate-400 hover:text-red-500 font-bold"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </section>

        {/* Social Links */}
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-card space-y-6">
          <h2 className="text-xl font-bold text-slate-950">Social & Portfolio Links</h2>
          <div className="grid gap-5 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                GitHub URL
              </label>
              <input
                type="url"
                value={profile.githubUrl}
                onChange={(e) => handleChange("githubUrl", e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-medium text-slate-900 outline-none focus:border-slate-950"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                LinkedIn URL
              </label>
              <input
                type="url"
                value={profile.linkedInUrl}
                onChange={(e) => handleChange("linkedInUrl", e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-medium text-slate-900 outline-none focus:border-slate-950"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Portfolio URL
              </label>
              <input
                type="url"
                value={profile.portfolioUrl}
                onChange={(e) => handleChange("portfolioUrl", e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-medium text-slate-900 outline-none focus:border-slate-950"
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
