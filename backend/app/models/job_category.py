from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.orm import relationship

from .base import Base


class JobCategory(Base):
    __tablename__ = "job_categories"

    job_id = Column(String(36), ForeignKey("jobs.id", ondelete="CASCADE"), primary_key=True)
    category_id = Column(String(36), ForeignKey("categories.id", ondelete="CASCADE"), primary_key=True)

    category = relationship("Category", back_populates="job_categories")
    job = relationship("Job", lazy="selectin")
