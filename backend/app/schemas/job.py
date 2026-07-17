from __future__ import annotations

from datetime import datetime
from typing import List
from uuid import UUID

from pydantic import AnyUrl, BaseModel, ConfigDict


class JobResponse(BaseModel):
    id: UUID
    slug: str
    title: str
    description: str
    location: str
    company: str
    apply_url: AnyUrl
    skills: List[str]
    remote: bool
    published_at: datetime

    model_config = ConfigDict(from_attributes=True)


class JobListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: List[JobResponse]
