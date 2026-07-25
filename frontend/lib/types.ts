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

export interface PaginationMeta {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface JobListResponse {
  items: Job[];
  pagination: PaginationMeta;
}
