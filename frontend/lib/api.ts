/**
 * Centralized API client configuration for JobNova frontend.
 * Resolves API URL based on environment variables and browser/server context.
 */

export function getApiUrl(): string {
  const envUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL;

  if (envUrl) {
    return envUrl.replace(/\/$/, "");
  }

  if (typeof window === "undefined") {
    return "http://localhost:8000";
  }

  return "http://localhost:8000";
}

/**
 * Standard fetch wrapper with error handling and optional development logging.
 */
export async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const baseUrl = getApiUrl();
  const url = `${baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const startTime = typeof performance !== "undefined" ? performance.now() : 0;

  if (process.env.NODE_ENV === "development") {
    console.log(`[API Fetch] ${options?.method || "GET"} -> ${url}`);
  }

  try {
    const res = await fetch(url, options);

    if (process.env.NODE_ENV === "development" && startTime) {
      const duration = (performance.now() - startTime).toFixed(1);
      console.log(`[API Response] ${res.status} (${duration}ms) <- ${url}`);
    }

    if (!res.ok) {
      const errorText = await res.text().catch(() => "");
      throw new Error(`API error ${res.status}: ${res.statusText} ${errorText}`);
    }

    return res.json();
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error(`[API Error] ${url}:`, error);
    }
    throw error;
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

export interface JobData {
  id: string;
  slug: string;
  title: string;
  description: string;
  location: string;
  company: string;
  apply_url: string;
  skills: string[];
  remote: boolean;
  published_at: string;
  // Enhanced fields
  country?: string;
  city?: string;
  state?: string;
  employment_type?: string;
  experience_level?: string;
  is_internship?: boolean;
  is_fresher?: boolean;
  job_category?: string;
  ai_tags?: string[];
  salary?: string;
  currency?: string;
  hybrid?: boolean;
  onsite?: boolean;
  company_slug?: string;
  company_logo?: string;
  company_verified?: boolean;
}

export interface TrendingCompany {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  industry?: string;
  size?: string;
  verified: boolean;
  remote_policy?: string;
  job_count: number;
}

export interface SectionMeta {
  key: string;
  title: string;
  subtitle?: string;
  icon?: string;
  enabled: boolean;
  order: number;
  view_all_href?: string;
  view_all_label?: string;
  limit: number;
}

export interface HomeJobsData {
  // Backward-compatible named fields
  india_jobs: JobData[];
  remote_jobs: JobData[];
  internships: JobData[];
  freshers: JobData[];
  latest: JobData[];
  // Extended
  sections: SectionMeta[];
  trending_companies: TrendingCompany[];
  section_data: Record<string, JobData[]>;
}

export interface MemeData {
  id: string;
  title: string;
  image_url: string;
  category: string;
  is_pinned: boolean;
  is_active: boolean;
  source?: string;
  alt_text?: string;
  created_at?: string;
}

export interface HomepageSectionConfig {
  id: string;
  key: string;
  title: string;
  subtitle?: string;
  icon?: string;
  enabled: boolean;
  order: number;
  query_filter?: Record<string, unknown>;
  view_all_href?: string;
  view_all_label?: string;
  limit: number;
}

// ──────────────────────────────────────────────────────────────────────────────
// API Functions
// ──────────────────────────────────────────────────────────────────────────────

export async function getHomeJobs(): Promise<HomeJobsData> {
  const baseUrl = getApiUrl();
  try {
    const res = await fetch(`${baseUrl}/api/jobs/home`, { cache: "no-store" });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("getHomeJobs fetch warning:", err);
  }
  return {
    india_jobs: [],
    remote_jobs: [],
    internships: [],
    freshers: [],
    latest: [],
    sections: [],
    trending_companies: [],
    section_data: {},
  };
}

export async function getMemes(category?: string): Promise<MemeData[]> {
  const baseUrl = getApiUrl();
  try {
    const url = category
      ? `${baseUrl}/api/memes?category=${encodeURIComponent(category)}`
      : `${baseUrl}/api/memes`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (res.ok) {
      const data = await res.json();
      return data.data || [];
    }
  } catch (err) {
    console.warn("getMemes fetch warning:", err);
  }
  return [];
}

export async function getHomepageSections(): Promise<HomepageSectionConfig[]> {
  const baseUrl = getApiUrl();
  try {
    const res = await fetch(`${baseUrl}/api/homepage/sections`, {
      next: { revalidate: 300 },
    });
    if (res.ok) {
      const data = await res.json();
      return data.data || [];
    }
  } catch (err) {
    console.warn("getHomepageSections fetch warning:", err);
  }
  return [];
}

export async function getTrendingCompanies(limit = 10): Promise<TrendingCompany[]> {
  const baseUrl = getApiUrl();
  try {
    const res = await fetch(
      `${baseUrl}/api/companies/trending?limit=${limit}`,
      { next: { revalidate: 600 } }
    );
    if (res.ok) {
      const data = await res.json();
      return data.data || [];
    }
  } catch {
    // Fall through — trending companies are non-critical
  }
  return [];
}
