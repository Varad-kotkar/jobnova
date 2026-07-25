import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, String, Text, DateTime, ForeignKey, UniqueConstraint, desc
import sqlalchemy as sa
from sqlalchemy.orm import relationship

from .base import Base


class JobApplication(Base):
    __tablename__ = "job_applications"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    job_id = Column(String(36), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(50), nullable=False, default="Applied", index=True)  # Applied, Screening, Interview, Offer, Rejected, Withdrawn
    source = Column(String(100), nullable=True, default="JobNova Portal")
    cover_letter = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    interview_date = Column(DateTime(timezone=True), nullable=True)
    salary_offered = Column(String(100), nullable=True)
    priority = Column(String(20), nullable=False, default="Medium")  # High, Medium, Low
    follow_up_date = Column(DateTime(timezone=True), nullable=True)
    archived = Column(Boolean, nullable=False, default=False)
    applied_at = Column(DateTime(timezone=True), server_default=sa.func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False)

    user = relationship("User", lazy="selectin")
    job = relationship("Job", lazy="selectin")
    history = relationship("ApplicationStatusHistory", back_populates="application", cascade="all, delete-orphan", order_by="[desc(ApplicationStatusHistory.changed_at), desc(ApplicationStatusHistory.id)]")

    __table_args__ = (
        UniqueConstraint("user_id", "job_id", name="uq_user_job_application"),
    )
