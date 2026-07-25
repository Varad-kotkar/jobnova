import uuid
from datetime import datetime
# pylint: disable=E1102

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String, Text, UniqueConstraint, JSON
import sqlalchemy as sa
from sqlalchemy.orm import relationship

from .base import Base


class Job(Base):
    __tablename__ = "jobs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    source_id = Column(String(36), ForeignKey("sources.id"), nullable=False, index=True)
    company_id = Column(String(36), ForeignKey("companies.id"), nullable=False, index=True)
    title = Column(String(512), nullable=False)
    description = Column(Text, nullable=False)
    location = Column(String(255), nullable=False, index=True)
    apply_url = Column(String(2048), nullable=False, unique=True, index=True)
    slug = Column(String(1024), nullable=False, index=True)
    skills = Column(JSON, nullable=False, default=list)
    remote = Column(Boolean, nullable=False, default=False, index=True)
    published_at = Column(DateTime(timezone=True), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=sa.func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False)

    source = relationship("Source", back_populates="jobs", lazy="joined")
    company = relationship("Company", back_populates="jobs", lazy="joined")

    __table_args__ = (
        UniqueConstraint("slug", name="uq_jobs_slug"),
    )
