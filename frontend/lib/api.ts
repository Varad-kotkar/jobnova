/**
 * Centralized API client configuration for JobNova frontend.
 * Resolves API URL based on environment variables and browser/server context.
 */

export function getApiUrl(): string {
  // If explicitly configured in environment (e.g. Railway backend URL on Vercel)
  const envUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL;

  if (envUrl) {
    return envUrl.replace(/\/$/, "");
  }

  // Server-side default in Node runtime
  if (typeof window === "undefined") {
    return "http://localhost:8000";
  }

  // Client-side fallback
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

export interface HomeJobsData {
  india_jobs: any[];
  remote_jobs: any[];
  internships: any[];
  freshers: any[];
  latest: any[];
}

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
  };
}
