import uuid
from sqlalchemy import Boolean, Column, Integer, JSON, String, Text
from .base import Base


class HomepageSection(Base):
    """DB-driven homepage section configuration.

    Allows enabling, disabling, reordering, or renaming sections without
    code changes. Each section maps to a query filter set that is executed
    in job_query.query_home_jobs().
    """

    __tablename__ = "homepage_sections"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    # Unique identifier used by frontend and query builder (e.g. "india_jobs")
    key = Column(String(100), nullable=False, unique=True, index=True)

    title = Column(String(200), nullable=False)
    subtitle = Column(String(500), nullable=True)
    icon = Column(String(10), nullable=True)           # emoji icon

    enabled = Column(Boolean, nullable=False, default=True)
    order = Column(Integer, nullable=False, default=0)

    # JSON query filters applied when fetching jobs for this section
    # Example: {"country": "India"} or {"remote": true, "is_internship": false}
    query_filter = Column(JSON, nullable=True, default=dict)

    view_all_href = Column(String(500), nullable=True)  # Link for "View All"
    view_all_label = Column(String(100), nullable=True)
    limit = Column(Integer, nullable=False, default=12)  # cards to display
