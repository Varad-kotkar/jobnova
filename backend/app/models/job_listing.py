from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Any, Dict, List


@dataclass(frozen=True)
class JobListing:
    company: str
    title: str
    location: str
    description: str
    apply_url: str
    skills: List[str]
    remote: bool
    published_at: datetime

    def to_dict(self) -> Dict[str, Any]:
        return {
            "company": self.company,
            "title": self.title,
            "location": self.location,
            "description": self.description,
            "apply_url": self.apply_url,
            "skills": self.skills,
            "remote": self.remote,
            "published_at": self.published_at.isoformat(),
        }
