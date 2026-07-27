import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String, JSON
import sqlalchemy as sa
from sqlalchemy.orm import relationship

from .base import Base


class SavedSearch(Base):
    __tablename__ = "saved_searches"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    label = Column(String(255), nullable=False)  # User-friendly label e.g. "Python Remote"
    query = Column(String(500), nullable=False)  # Search keyword
    filters = Column(JSON, nullable=True, default=dict)  # {remote: true, location: "Pune", ...}
    notify = Column(Boolean, nullable=False, default=True)  # Email/in-app notify when matching
    last_notified_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=sa.func.now(), nullable=False)

    user = relationship("User", lazy="selectin")
