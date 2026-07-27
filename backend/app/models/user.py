import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, String, DateTime
import sqlalchemy as sa
from sqlalchemy.orm import relationship

from .base import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), nullable=False, unique=True, index=True)
    hashed_password = Column(String(255), nullable=True)
    full_name = Column(String(255), nullable=False)
    avatar_url = Column(String(1024), nullable=True)
    role = Column(String(50), nullable=False, default="candidate")
    is_active = Column(Boolean, nullable=False, default=True, server_default=sa.text("true"))
    is_verified = Column(Boolean, nullable=False, default=False, server_default=sa.text("false"))
    created_at = Column(DateTime(timezone=True), server_default=sa.func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False)

    profile = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
