import uuid
from datetime import datetime

from sqlalchemy import Column, String, Text, DateTime, ForeignKey
import sqlalchemy as sa
from sqlalchemy.orm import relationship

from .base import Base


class ApplicationStatusHistory(Base):
    __tablename__ = "application_status_histories"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    application_id = Column(String(36), ForeignKey("job_applications.id", ondelete="CASCADE"), nullable=False, index=True)
    previous_status = Column(String(50), nullable=True)
    new_status = Column(String(50), nullable=False)
    notes = Column(Text, nullable=True)
    changed_at = Column(DateTime(timezone=True), server_default=sa.func.now(), nullable=False)

    application = relationship("JobApplication", back_populates="history")
