"""Add enhanced job classification fields for deduplication and AI tagging

Revision ID: 013_add_enhanced_job_fields
Revises: 012_add_job_classification_fields
Create Date: 2026-07-28
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "013_add_enhanced_job_fields"
down_revision: Union[str, None] = "012_add_job_classification_fields"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("jobs") as batch_op:
        batch_op.add_column(sa.Column("state", sa.String(100), nullable=True))
        batch_op.add_column(sa.Column("hybrid", sa.Boolean(), nullable=False, server_default=sa.text("false")))
        batch_op.add_column(sa.Column("onsite", sa.Boolean(), nullable=False, server_default=sa.text("false")))
        batch_op.add_column(sa.Column("salary", sa.String(200), nullable=True))
        batch_op.add_column(sa.Column("currency", sa.String(10), nullable=True))
        batch_op.add_column(sa.Column("industry", sa.String(100), nullable=True))
        batch_op.add_column(sa.Column("company_size", sa.String(100), nullable=True))
        batch_op.add_column(sa.Column("job_category", sa.String(100), nullable=True))
        batch_op.add_column(sa.Column("ai_tags", sa.JSON(), nullable=True))
        # duplicate_hash added without inline unique; index created below
        batch_op.add_column(sa.Column("duplicate_hash", sa.String(64), nullable=True))

    # Create indexes outside batch context (supported by all backends)
    op.create_index("ix_jobs_state", "jobs", ["state"])
    op.create_index("ix_jobs_job_category", "jobs", ["job_category"])
    op.create_index("ix_jobs_duplicate_hash", "jobs", ["duplicate_hash"], unique=True)



def downgrade() -> None:
    op.drop_index("ix_jobs_duplicate_hash", table_name="jobs")
    op.drop_index("ix_jobs_job_category", table_name="jobs")
    op.drop_index("ix_jobs_state", table_name="jobs")
    with op.batch_alter_table("jobs") as batch_op:
        batch_op.drop_column("duplicate_hash")
        batch_op.drop_column("ai_tags")
        batch_op.drop_column("job_category")
        batch_op.drop_column("company_size")
        batch_op.drop_column("industry")
        batch_op.drop_column("currency")
        batch_op.drop_column("salary")
        batch_op.drop_column("onsite")
        batch_op.drop_column("hybrid")
        batch_op.drop_column("state")

