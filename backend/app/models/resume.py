import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, String, Text, Integer, JSON, DateTime, ForeignKey
import sqlalchemy as sa
from sqlalchemy.orm import relationship

from .base import Base


class Resume(Base):
    __tablename__ = "resumes"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(1024), nullable=False)
    file_type = Column(String(100), nullable=False)  # application/pdf, text/plain, etc.
    file_size = Column(Integer, nullable=False, default=0)
    parsed_text = Column(Text, nullable=True)
    extracted_skills = Column(JSON, nullable=True, default=list)
    extracted_experience = Column(JSON, nullable=True, default=list)
    extracted_education = Column(JSON, nullable=True, default=list)
    contact_info = Column(JSON, nullable=True, default=dict)
    is_primary = Column(Boolean, nullable=False, default=True)
    version = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime(timezone=True), server_default=sa.func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False)

    user = relationship("User", lazy="selectin")
