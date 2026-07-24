export interface Job {
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
}

export interface JobListResponse {
  total: number;
  page: number;
  page_size: number;
  items: Job[];
}
