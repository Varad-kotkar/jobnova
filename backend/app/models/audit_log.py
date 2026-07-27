import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, String, Text, JSON
import sqlalchemy as sa

from .base import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    admin_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    action = Column(String(100), nullable=False, index=True)  # e.g. user.suspend, job.delete, recruiter.approve
    target_type = Column(String(50), nullable=True)  # user, job, recruiter, company, system
    target_id = Column(String(36), nullable=True)
    details = Column(JSON, nullable=True, default=dict)  # Additional context
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=sa.func.now(), nullable=False, index=True)
