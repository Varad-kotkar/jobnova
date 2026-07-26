import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, String
import sqlalchemy as sa
from sqlalchemy.orm import relationship

from .base import Base


class RecruiterProfile(Base):
    __tablename__ = "recruiter_profiles"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=True, index=True)
    job_title = Column(String(255), nullable=True, default="Technical Recruiter")
    department = Column(String(255), nullable=True, default="Talent Acquisition")
    company_website = Column(String(512), nullable=True)
    linkedin_url = Column(String(512), nullable=True)
    verification_status = Column(String(50), nullable=False, default="pending", index=True)  # pending, approved, rejected, suspended
    verification_documents = Column(sa.JSON, nullable=False, default=list)
    created_at = Column(DateTime(timezone=True), server_default=sa.func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False)

    user = relationship("User", lazy="selectin")
    company = relationship("Company", lazy="selectin")

