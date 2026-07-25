import re
import uuid

from sqlalchemy import Column, String, Text, UniqueConstraint
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

    jobs = relationship("Job", back_populates="company", lazy="selectin")

    __table_args__ = (
        UniqueConstraint("name", name="uq_companies_name"),
        UniqueConstraint("slug", name="uq_companies_slug"),
    )
