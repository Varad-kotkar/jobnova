"""add company slug and metadata

Revision ID: 002_company_metadata
Revises: 001_initial_schema
Create Date: 2026-07-25 17:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "002_company_metadata"
down_revision: Union[str, None] = "001_initial_schema"
branch_labels: Union[Sequence[str], None] = None
depends_on: Union[Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("companies", sa.Column("slug", sa.String(length=255), nullable=True))
    op.add_column("companies", sa.Column("website", sa.String(length=512), nullable=True))
    op.add_column("companies", sa.Column("industry", sa.String(length=255), nullable=True))
    op.add_column("companies", sa.Column("size", sa.String(length=100), nullable=True))
    op.add_column("companies", sa.Column("headquarters", sa.String(length=255), nullable=True))
    op.add_column("companies", sa.Column("description", sa.Text(), nullable=True))
    op.add_column("companies", sa.Column("logo_url", sa.String(length=1024), nullable=True))

    # Populate default slug based on lower name
    op.execute("UPDATE companies SET slug = LOWER(REPLACE(name, ' ', '-')) WHERE slug IS NULL")
    
    op.alter_column("companies", "slug", nullable=False)
    op.create_index(op.f("ix_companies_slug"), "companies", ["slug"], unique=True)
    op.create_unique_constraint("uq_companies_slug", "companies", ["slug"])


def downgrade() -> None:
    op.drop_constraint("uq_companies_slug", "companies", type_="unique")
    op.drop_index(op.f("ix_companies_slug"), table_name="companies")
    op.drop_column("companies", "logo_url")
    op.drop_column("companies", "description")
    op.drop_column("companies", "headquarters")
    op.drop_column("companies", "size")
    op.drop_column("companies", "industry")
    op.drop_column("companies", "website")
    op.drop_column("companies", "slug")
