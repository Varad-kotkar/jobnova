"""Add job classification columns and indexes for curated homepage and student/fresher discovery

Revision ID: 012_add_job_classification_fields
Revises: 011_v1_production_schema
Create Date: 2026-07-27
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers
revision: str = "012_add_job_classification_fields"
down_revision: Union[str, None] = "011_v1_production_schema"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("jobs") as batch_op:
        batch_op.add_column(sa.Column("country", sa.String(100), nullable=True))
        batch_op.add_column(sa.Column("city", sa.String(100), nullable=True))
        batch_op.add_column(sa.Column("employment_type", sa.String(50), nullable=True))
        batch_op.add_column(sa.Column("experience_level", sa.String(50), nullable=True))
        batch_op.add_column(sa.Column("is_internship", sa.Boolean(), nullable=False, server_default=sa.text("false")))
        batch_op.add_column(sa.Column("is_fresher", sa.Boolean(), nullable=False, server_default=sa.text("false")))
        
        batch_op.create_index("ix_jobs_country", ["country"])
        batch_op.create_index("ix_jobs_city", ["city"])
        batch_op.create_index("ix_jobs_employment_type", ["employment_type"])
        batch_op.create_index("ix_jobs_experience_level", ["experience_level"])
        batch_op.create_index("ix_jobs_is_internship", ["is_internship"])
        batch_op.create_index("ix_jobs_is_fresher", ["is_fresher"])


def downgrade() -> None:
    with op.batch_alter_table("jobs") as batch_op:
        batch_op.drop_index("ix_jobs_is_fresher")
        batch_op.drop_index("ix_jobs_is_internship")
        batch_op.drop_index("ix_jobs_experience_level")
        batch_op.drop_index("ix_jobs_employment_type")
        batch_op.drop_index("ix_jobs_city")
        batch_op.drop_index("ix_jobs_country")

        batch_op.drop_column("is_fresher")
        batch_op.drop_column("is_internship")
        batch_op.drop_column("experience_level")
        batch_op.drop_column("employment_type")
        batch_op.drop_column("city")
        batch_op.drop_column("country")
