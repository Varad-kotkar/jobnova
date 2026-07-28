import uuid
from datetime import datetime

import sqlalchemy as sa
from sqlalchemy import Boolean, Column, DateTime, String, Text

from .base import Base


class Meme(Base):
    """Developer Corner meme content.

    Supports images and GIFs. Admin-uploadable with pin, category, and
    active/inactive toggle. Pinned memes appear first in the Developer Corner.
    """

    __tablename__ = "memes"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    title = Column(String(300), nullable=False)
    image_url = Column(Text, nullable=False)  # supports external URLs and CDN

    # Categories: developer | placement | interview | motivation | humor
    category = Column(String(50), nullable=False, default="developer", index=True)

    is_pinned = Column(Boolean, nullable=False, default=False, server_default=sa.text("false"))
    is_active = Column(Boolean, nullable=False, default=True, server_default=sa.text("true"), index=True)

    # Tracks origin: "admin_upload" | "reddit" | "static"
    source = Column(String(100), nullable=True, default="admin_upload")

    alt_text = Column(String(500), nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        server_default=sa.func.now(),
        nullable=False,
    )
