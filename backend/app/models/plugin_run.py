import uuid

from sqlalchemy import Column, DateTime, Integer, String, Text

from .base import Base


class PluginRun(Base):
    __tablename__ = "plugin_runs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    plugin_name = Column(String(255), nullable=False, index=True)
    started_at = Column(DateTime(timezone=True), nullable=False)
    finished_at = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(50), nullable=False)
    jobs_fetched = Column(Integer, nullable=False, default=0)
    jobs_inserted = Column(Integer, nullable=False, default=0)
    error = Column(Text, nullable=True)
    duration_ms = Column(Integer, nullable=True)
