export interface SavedJobItem {
  id: string;
  slug: string;
  title: string;
  company: string;
  location: string;
  remote: boolean;
  savedAt: string;
}

export interface AppliedJobItem {
  id: string;
  slug: string;
  title: string;
  company: string;
  appliedAt: string;
  status: "Submitted" | "Under Review" | "Interview" | "Accepted" | "Rejected";
}

export interface UserProfileData {
  name: string;
  email: string;
  headline: string;
  location: string;
  bio: string;
  skills: string[];
  githubUrl: string;
  linkedInUrl: string;
  portfolioUrl: string;
  resumeFileName: string;
  completionPercentage: number;
}

const SAVED_JOBS_KEY = "jobnova_saved_jobs";
const APPLIED_JOBS_KEY = "jobnova_applied_jobs";
const USER_PROFILE_KEY = "jobnova_user_profile";

export function getSavedJobs(): SavedJobItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SAVED_JOBS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function isJobSaved(jobId: string): boolean {
  const list = getSavedJobs();
  return list.some((item) => item.id === jobId);
}

export function toggleSaveJob(
  job: {
    id: string;
    slug: string;
    title: string;
    company: string;
    location: string;
    remote: boolean;
  },
  token?: string | null
): boolean {
  if (typeof window === "undefined") return false;
  const list = getSavedJobs();
  const index = list.findIndex((item) => item.id === job.id);
  let nowSaved = false;

  if (index >= 0) {
    list.splice(index, 1);
    nowSaved = false;
  } else {
    list.unshift({
      id: job.id,
      slug: job.slug,
      title: job.title,
      company: job.company,
      location: job.location,
      remote: job.remote,
      savedAt: new Date().toISOString(),
    });
    nowSaved = true;
  }

  localStorage.setItem(SAVED_JOBS_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event("jobnova_saved_jobs_changed"));

  // Async sync with backend if token exists
  if (token) {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    const method = nowSaved ? "POST" : "DELETE";
    fetch(`${apiBase}/api/jobs/${job.id}/save`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }).catch((err) => console.warn("Backend saved job sync warning:", err));
  }

  return nowSaved;
}

export function getAppliedJobs(): AppliedJobItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(APPLIED_JOBS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function recordJobApplication(
  job: {
    id: string;
    slug: string;
    title: string;
    company: string;
  },
  token?: string | null
): void {
  if (typeof window === "undefined") return;
  const list = getAppliedJobs();
  if (!list.some((item) => item.id === job.id)) {
    list.unshift({
      id: job.id,
      slug: job.slug,
      title: job.title,
      company: job.company,
      appliedAt: new Date().toISOString(),
      status: "Submitted",
    });
    localStorage.setItem(APPLIED_JOBS_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event("jobnova_applied_jobs_changed"));

    // Async sync with backend if token exists
    if (token) {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      fetch(`${apiBase}/api/applications`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ job_id: job.id, status: "Applied" }),
      }).catch((err) => console.warn("Backend application record sync warning:", err));
    }
  }
}

export const DEFAULT_USER_PROFILE: UserProfileData = {
  name: "Alex Rivera",
  email: "alex.rivera@example.com",
  headline: "Senior Full-Stack Engineer & Open Source Contributor",
  location: "San Francisco, CA",
  bio: "Passionate about building ultra-fast web applications with Next.js, React, TypeScript, and distributed cloud backends.",
  skills: ["React", "TypeScript", "Next.js", "Python", "FastAPI", "PostgreSQL", "TailwindCSS"],
  githubUrl: "https://github.com/alexrivera",
  linkedInUrl: "https://linkedin.com/in/alexrivera",
  portfolioUrl: "https://alexrivera.dev",
  resumeFileName: "Alex_Rivera_Resume_2026.pdf",
  completionPercentage: 85,
};

export function getUserProfile(): UserProfileData {
  if (typeof window === "undefined") return DEFAULT_USER_PROFILE;
  try {
    const raw = localStorage.getItem(USER_PROFILE_KEY);
    return raw ? { ...DEFAULT_USER_PROFILE, ...JSON.parse(raw) } : DEFAULT_USER_PROFILE;
  } catch {
    return DEFAULT_USER_PROFILE;
  }
}

export function saveUserProfile(data: Partial<UserProfileData>): UserProfileData {
  const current = getUserProfile();
  const updated = { ...current, ...data };
  
  // Calculate completion percentage
  let score = 0;
  if (updated.name) score += 15;
  if (updated.email) score += 15;
  if (updated.headline) score += 15;
  if (updated.location) score += 10;
  if (updated.bio) score += 15;
  if (updated.skills && updated.skills.length >= 3) score += 15;
  if (updated.githubUrl || updated.linkedInUrl || updated.portfolioUrl) score += 15;
  updated.completionPercentage = Math.min(100, score);

  if (typeof window !== "undefined") {
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event("jobnova_user_profile_changed"));
  }
  return updated;
}
