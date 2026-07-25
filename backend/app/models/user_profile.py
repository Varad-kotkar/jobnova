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
    resume_url = Column(String(1024), nullable=True)
    skills = Column(JSON, nullable=True, default=list)
    github_url = Column(String(512), nullable=True)
    linkedin_url = Column(String(512), nullable=True)
    portfolio_url = Column(String(512), nullable=True)
    preferred_roles = Column(JSON, nullable=True, default=list)
    preferred_locations = Column(JSON, nullable=True, default=list)
    remote_preference = Column(Boolean, nullable=True, default=True)
    salary_expectation = Column(String(100), nullable=True)
    completion_percentage = Column(Integer, nullable=False, default=30)
    created_at = Column(DateTime(timezone=True), server_default=sa.func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False)

    user = relationship("User", back_populates="profile")
