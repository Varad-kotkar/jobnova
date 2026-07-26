"""add recruiter verification fields and status index

Revision ID: 010_add_recruiter_verification
Revises: 009_add_recruiter_portal
Create Date: 2026-07-26 22:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "010_add_recruiter_verification"
down_revision: Union[str, None] = "009_add_recruiter_portal"
branch_labels: Union[Sequence[str], None] = None
depends_on: Union[Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("recruiter_profiles", sa.Column("company_website", sa.String(length=512), nullable=True))
    op.add_column("recruiter_profiles", sa.Column("linkedin_url", sa.String(length=512), nullable=True))
    op.add_column("recruiter_profiles", sa.Column("verification_status", sa.String(length=50), nullable=False, server_default="pending"))
    op.add_column("recruiter_profiles", sa.Column("verification_documents", sa.JSON(), nullable=False, server_default="[]"))
    op.create_index(op.f("ix_recruiter_profiles_verification_status"), "recruiter_profiles", ["verification_status"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_recruiter_profiles_verification_status"), table_name="recruiter_profiles")
    op.drop_column("recruiter_profiles", "verification_documents")
    op.drop_column("recruiter_profiles", "verification_status")
    op.drop_column("recruiter_profiles", "linkedin_url")
    op.drop_column("recruiter_profiles", "company_website")
