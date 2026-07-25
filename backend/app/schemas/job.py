from __future__ import annotations

from datetime import datetime
from typing import Any, List
from uuid import UUID

from pydantic import AnyUrl, BaseModel, ConfigDict


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

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def from_orm_model(cls, job: Any) -> JobResponse:
        company_str = "Unknown"
        if hasattr(job, "company") and job.company:
            if isinstance(job.company, str):
                company_str = job.company
            elif hasattr(job.company, "name"):
                company_str = job.company.name

        return cls(
            id=job.id,
            slug=job.slug,
            title=job.title,
            description=job.description or "",
            location=job.location or "Remote",
            company=company_str,
            apply_url=str(job.apply_url or "https://example.com"),
            skills=job.skills or [],
            remote=bool(job.remote),
            published_at=job.published_at or datetime.utcnow(),
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
