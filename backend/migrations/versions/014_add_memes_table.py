"""Add memes table for Developer Corner feature

Revision ID: 014_add_memes_table
Revises: 013_add_enhanced_job_fields
Create Date: 2026-07-28
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "014_add_memes_table"
down_revision: Union[str, None] = "013_add_enhanced_job_fields"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "memes",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("title", sa.String(300), nullable=False),
        sa.Column("image_url", sa.Text(), nullable=False),
        sa.Column("category", sa.String(50), nullable=False, server_default="developer"),
        sa.Column("is_pinned", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("source", sa.String(100), nullable=True),
        sa.Column("alt_text", sa.String(500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_memes_category", "memes", ["category"])
    op.create_index("ix_memes_is_active", "memes", ["is_active"])


def downgrade() -> None:
    op.drop_index("ix_memes_is_active", table_name="memes")
    op.drop_index("ix_memes_category", table_name="memes")
    op.drop_table("memes")
