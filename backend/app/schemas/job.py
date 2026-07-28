from __future__ import annotations

import html
import re
from urllib.parse import quote
from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


def clean_description_text(raw_text: Optional[str]) -> str:
    if not raw_text:
        return ""
    decoded = html.unescape(html.unescape(raw_text))
    decoded = re.sub(r'<br\s*/?>', '\n', decoded, flags=re.IGNORECASE)
    decoded = re.sub(r'<li\b[^>]*>', '\n• ', decoded, flags=re.IGNORECASE)
    decoded = re.sub(r'</?(p|div|ul|ol|tr|h[1-6])\b[^>]*>', '\n', decoded, flags=re.IGNORECASE)
    clean = re.sub(r'<[^>]+>', ' ', decoded)
    lines = [line.strip() for line in clean.split('\n') if line.strip()]
    res = '\n\n'.join(lines) if lines else clean.strip()
    return res[:15000]


class JobResponse(BaseModel):
    id: UUID
    slug: str
    title: str
    description: str
    location: str
    company: str
    apply_url: str
    skills: List[str]
    remote: bool
    published_at: datetime

    # Enhanced fields (all optional for backward compatibility)
    country: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    employment_type: Optional[str] = None
    experience_level: Optional[str] = None
    is_internship: bool = False
    is_fresher: bool = False
    job_category: Optional[str] = None
    ai_tags: Optional[List[str]] = None
    salary: Optional[str] = None
    currency: Optional[str] = None
    hybrid: bool = False
    onsite: bool = False

    # Company enrichment
    company_slug: Optional[str] = None
    company_logo: Optional[str] = None
    company_verified: bool = False

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def from_orm_model(cls, job: Any) -> "JobResponse":
        company_str = "Unknown"
        company_slug = None
        company_logo = None
        company_verified = False

        if hasattr(job, "company") and job.company:
            if isinstance(job.company, str):
                company_str = job.company
            elif hasattr(job.company, "name"):
                company_str = job.company.name
                company_slug = getattr(job.company, "slug", None)
                company_logo = getattr(job.company, "logo_url", None)
                company_verified = getattr(job.company, "verified", False) or False

        if not company_logo or not str(company_logo).strip():
            encoded_name = quote(company_str if company_str and company_str != "Unknown" else "Company")
            company_logo = f"https://ui-avatars.com/api/?name={encoded_name}&background=0284c7&color=ffffff&bold=true"

        return cls(
            id=job.id,
            slug=job.slug,
            title=job.title,
            description=clean_description_text(job.description or ""),
            location=job.location or "Remote",
            company=company_str,
            apply_url=str(job.apply_url or "https://example.com"),
            skills=job.skills or [],
            remote=bool(job.remote),
            published_at=job.published_at or datetime.utcnow(),
            # Enhanced
            country=getattr(job, "country", None),
            city=getattr(job, "city", None),
            state=getattr(job, "state", None),
            employment_type=getattr(job, "employment_type", None),
            experience_level=getattr(job, "experience_level", None),
            is_internship=bool(getattr(job, "is_internship", False)),
            is_fresher=bool(getattr(job, "is_fresher", False)),
            job_category=getattr(job, "job_category", None),
            ai_tags=getattr(job, "ai_tags", None) or [],
            salary=getattr(job, "salary", None),
            currency=getattr(job, "currency", None),
            hybrid=bool(getattr(job, "hybrid", False)),
            onsite=bool(getattr(job, "onsite", False)),
            company_slug=company_slug,
            company_logo=company_logo,
            company_verified=bool(company_verified),
        )


class PaginationMeta(BaseModel):
    page: int
    page_size: int
    total: int
    total_pages: int
    has_next: bool
    has_previous: bool


class JobListResponse(BaseModel):
    items: List[JobResponse]
    pagination: PaginationMeta


class TrendingCompany(BaseModel):
    id: str
    name: str
    slug: str
    logo_url: Optional[str] = None
    industry: Optional[str] = None
    size: Optional[str] = None
    verified: bool = False
    remote_policy: Optional[str] = None
    job_count: int


class SectionMeta(BaseModel):
    key: str
    title: str
    subtitle: Optional[str] = None
    icon: Optional[str] = None
    enabled: bool
    order: int
    view_all_href: Optional[str] = None
    view_all_label: Optional[str] = None
    limit: int


class HomeJobsResponse(BaseModel):
    # Named section job lists (backward compatible)
    india_jobs: List[JobResponse] = []
    remote_jobs: List[JobResponse] = []
    internships: List[JobResponse] = []
    freshers: List[JobResponse] = []
    latest: List[JobResponse] = []

    # Extended sections (DB-driven, arbitrary keys)
    sections: List[SectionMeta] = []
    trending_companies: List[TrendingCompany] = []

    # Dynamic section data keyed by section.key
    section_data: Dict[str, List[JobResponse]] = {}
