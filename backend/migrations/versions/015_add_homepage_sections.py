"""Add homepage_sections table with default seed data

Revision ID: 015_add_homepage_sections
Revises: 014_add_memes_table
Create Date: 2026-07-28
"""
from typing import Sequence, Union
import uuid

from alembic import op
import sqlalchemy as sa

revision: str = "015_add_homepage_sections"
down_revision: Union[str, None] = "014_add_memes_table"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Default homepage section configuration
DEFAULT_SECTIONS = [
    {
        "id": str(uuid.uuid4()),
        "key": "india_jobs",
        "title": "🇮🇳 Latest India Jobs",
        "subtitle": "Top tech roles in Bengaluru, Pune, Hyderabad, Mumbai & Remote-India",
        "icon": "🇮🇳",
        "enabled": True,
        "order": 1,
        "query_filter": {"country": "India"},
        "view_all_href": "/jobs?country=India",
        "view_all_label": "View All India Jobs",
        "limit": 12,
    },
    {
        "id": str(uuid.uuid4()),
        "key": "remote_jobs",
        "title": "🌍 Fully Remote Jobs",
        "subtitle": "Work from anywhere — global remote opportunities",
        "icon": "🌍",
        "enabled": True,
        "order": 2,
        "query_filter": {"remote": True},
        "view_all_href": "/jobs?remote=true",
        "view_all_label": "View All Remote Jobs",
        "limit": 12,
    },
    {
        "id": str(uuid.uuid4()),
        "key": "internships",
        "title": "🎓 Internship Opportunities",
        "subtitle": "Start your career with internships in Software, Data, AI & Product",
        "icon": "🎓",
        "enabled": True,
        "order": 3,
        "query_filter": {"is_internship": True},
        "view_all_href": "/jobs?employment_type=Internship",
        "view_all_label": "View All Internships",
        "limit": 12,
    },
    {
        "id": str(uuid.uuid4()),
        "key": "freshers",
        "title": "👨‍🎓 Freshers & Graduate Jobs",
        "subtitle": "Entry-level, associate and campus hiring for new graduates",
        "icon": "👨‍🎓",
        "enabled": True,
        "order": 4,
        "query_filter": {"is_fresher": True},
        "view_all_href": "/jobs?experience_level=Fresher",
        "view_all_label": "View All Fresher Jobs",
        "limit": 12,
    },
    {
        "id": str(uuid.uuid4()),
        "key": "trending_companies",
        "title": "🚀 Trending Companies",
        "subtitle": "Most active hiring companies this month",
        "icon": "🚀",
        "enabled": True,
        "order": 5,
        "query_filter": {},
        "view_all_href": "/companies",
        "view_all_label": "View All Companies",
        "limit": 10,
    },
    {
        "id": str(uuid.uuid4()),
        "key": "latest",
        "title": "⚡ Recently Added",
        "subtitle": "Freshest tech listings added in the last 7 days",
        "icon": "⚡",
        "enabled": True,
        "order": 6,
        "query_filter": {},
        "view_all_href": "/jobs",
        "view_all_label": "View Full Job Catalog",
        "limit": 12,
    },
    {
        "id": str(uuid.uuid4()),
        "key": "developer_corner",
        "title": "😄 Developer Corner",
        "subtitle": "Memes, motivation and engineering humor for the community",
        "icon": "😄",
        "enabled": True,
        "order": 10,
        "query_filter": {},
        "view_all_href": None,
        "view_all_label": None,
        "limit": 8,
    },
]


def upgrade() -> None:
    op.create_table(
        "homepage_sections",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("key", sa.String(100), nullable=False, unique=True),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("subtitle", sa.String(500), nullable=True),
        sa.Column("icon", sa.String(10), nullable=True),
        sa.Column("enabled", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("query_filter", sa.JSON(), nullable=True),
        sa.Column("view_all_href", sa.String(500), nullable=True),
        sa.Column("view_all_label", sa.String(100), nullable=True),
        sa.Column("limit", sa.Integer(), nullable=False, server_default="12"),
    )
    op.create_index("ix_homepage_sections_key", "homepage_sections", ["key"], unique=True)
    op.create_index("ix_homepage_sections_order", "homepage_sections", ["order"])

    # Seed default sections
    sections_table = sa.table(
        "homepage_sections",
        sa.column("id", sa.String),
        sa.column("key", sa.String),
        sa.column("title", sa.String),
        sa.column("subtitle", sa.String),
        sa.column("icon", sa.String),
        sa.column("enabled", sa.Boolean),
        sa.column("order", sa.Integer),
        sa.column("query_filter", sa.JSON),
        sa.column("view_all_href", sa.String),
        sa.column("view_all_label", sa.String),
        sa.column("limit", sa.Integer),
    )
    op.bulk_insert(sections_table, DEFAULT_SECTIONS)


def downgrade() -> None:
    op.drop_index("ix_homepage_sections_order", table_name="homepage_sections")
    op.drop_index("ix_homepage_sections_key", table_name="homepage_sections")
    op.drop_table("homepage_sections")
