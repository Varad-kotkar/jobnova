import uuid
from datetime import datetime

from sqlalchemy import Column, String, Text, Integer, JSON, Boolean, DateTime, ForeignKey
import sqlalchemy as sa
from sqlalchemy.orm import relationship

from .base import Base


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    headline = Column(String(255), nullable=True)
    bio = Column(Text, nullable=True)
    location = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    resume_url = Column(String(1024), nullable=True)
    profile_photo_url = Column(String(1024), nullable=True)
    skills = Column(JSON, nullable=True, default=list)
    education = Column(JSON, nullable=True, default=list)  # [{degree, institution, year, field}]
    career_goal = Column(String(500), nullable=True)
    github_url = Column(String(512), nullable=True)
    linkedin_url = Column(String(512), nullable=True)
    portfolio_url = Column(String(512), nullable=True)
    preferred_roles = Column(JSON, nullable=True, default=list)
    preferred_locations = Column(JSON, nullable=True, default=list)
    remote_preference = Column(Boolean, nullable=True, default=True)
    salary_expectation = Column(String(100), nullable=True)
    completion_percentage = Column(Integer, nullable=False, default=10)
    onboarding_completed = Column(Boolean, nullable=False, default=False, server_default=sa.text("false"))
    availability = Column(String(100), nullable=True)  # Immediately, 2 weeks, 1 month, etc.
    work_authorization = Column(String(100), nullable=True)  # Citizen, PR, Visa required
    experience_years = Column(Integer, nullable=True)
    saved_companies = Column(JSON, nullable=True, default=list)  # [company_id, ...]
    recently_viewed_jobs = Column(JSON, nullable=True, default=list)  # [{job_id, viewed_at}, ...]
    weekly_summary_enabled = Column(Boolean, nullable=False, default=True, server_default=sa.text("true"))
    created_at = Column(DateTime(timezone=True), server_default=sa.func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False)

    user = relationship("User", back_populates="profile")
