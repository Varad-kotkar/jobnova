import uuid

from sqlalchemy import Column, String, UniqueConstraint
from sqlalchemy.orm import relationship

from .base import Base


class Company(Base):
    __tablename__ = "companies"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False, unique=True, index=True)

    jobs = relationship("Job", back_populates="company", lazy="selectin")

    __table_args__ = (UniqueConstraint("name", name="uq_companies_name"),)
