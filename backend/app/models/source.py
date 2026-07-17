import uuid

from sqlalchemy import Column, String, UniqueConstraint, JSON
from sqlalchemy.orm import relationship

from .base import Base


class Source(Base):
    __tablename__ = "sources"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False, unique=True, index=True)
    metadata_ = Column("metadata", JSON, nullable=True)

    jobs = relationship("Job", back_populates="source", lazy="selectin")

    __table_args__ = (UniqueConstraint("name", name="uq_sources_name"),)
