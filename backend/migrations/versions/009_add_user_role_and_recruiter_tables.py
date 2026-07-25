"""add role column to users and add recruiter_profiles table

Revision ID: 009_add_recruiter_portal
Revises: 008_add_notifications
Create Date: 2026-07-25 19:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "009_add_recruiter_portal"
down_revision: Union[str, None] = "008_add_notifications"
branch_labels: Union[Sequence[str], None] = None
depends_on: Union[Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("role", sa.String(length=50), nullable=False, server_default="candidate"))

    op.create_table(
        "recruiter_profiles",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("company_id", sa.String(length=36), nullable=True),
        sa.Column("job_title", sa.String(length=255), nullable=True, server_default="Technical Recruiter"),
        sa.Column("department", sa.String(length=255), nullable=True, server_default="Talent Acquisition"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id"),
    )
    op.create_index(op.f("ix_recruiter_profiles_user_id"), "recruiter_profiles", ["user_id"], unique=True)
    op.create_index(op.f("ix_recruiter_profiles_company_id"), "recruiter_profiles", ["company_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_recruiter_profiles_company_id"), table_name="recruiter_profiles")
    op.drop_index(op.f("ix_recruiter_profiles_user_id"), table_name="recruiter_profiles")
    op.drop_table("recruiter_profiles")
    op.drop_column("users", "role")
