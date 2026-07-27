import re
import uuid

from sqlalchemy import Boolean, Column, Integer, String, Text, UniqueConstraint, JSON
from sqlalchemy.orm import relationship

from .base import Base


def _default_company_slug(context):
    params = context.get_current_parameters()
    name = params.get("name", "")
    if not name:
        return f"company-{uuid.uuid4()}"
    cleaned = re.sub(r"[^\w\s-]", "", name.lower())
    return re.sub(r"[-\s]+", "-", cleaned).strip("-") or f"company-{uuid.uuid4()}"


class Company(Base):
    __tablename__ = "companies"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False, unique=True, index=True)
    slug = Column(String(255), nullable=False, unique=True, index=True, default=_default_company_slug)
    website = Column(String(512), nullable=True)
    industry = Column(String(255), nullable=True)
    size = Column(String(100), nullable=True)
    headquarters = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    logo_url = Column(String(1024), nullable=True)

    # Enhanced fields
    benefits = Column(JSON, nullable=True, default=list)  # ["Health Insurance", "401k", ...]
    tech_stack = Column(JSON, nullable=True, default=list)  # ["React", "Python", "AWS", ...]
    verified = Column(Boolean, nullable=False, default=False)
    founded_year = Column(Integer, nullable=True)
    employee_count = Column(String(100), nullable=True)  # "50-200", "1000+"
    culture = Column(Text, nullable=True)  # Company culture description
    remote_policy = Column(String(100), nullable=True)  # "Fully Remote", "Hybrid", "On-site"
    office_locations = Column(JSON, nullable=True, default=list)  # ["SF", "NYC", "Bangalore"]
    social_links = Column(JSON, nullable=True, default=dict)  # {twitter, linkedin, github}
    hiring_frequency = Column(String(100), nullable=True)  # "Active", "Occasional", "Rare"
    avg_response_time = Column(String(100), nullable=True)  # "< 1 week", "2-3 weeks"
    featured = Column(Boolean, nullable=False, default=False)

    jobs = relationship("Job", back_populates="company", lazy="selectin")

    __table_args__ = (
        UniqueConstraint("name", name="uq_companies_name"),
        UniqueConstraint("slug", name="uq_companies_slug"),
    )
