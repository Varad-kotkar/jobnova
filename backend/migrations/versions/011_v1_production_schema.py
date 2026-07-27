"""Add V1.0 production columns: profile enhancements, company enhancements, job active/featured, saved searches, audit logs

Revision ID: 011_v1_production_schema
Revises: 041b326c7e57
Create Date: 2026-07-27
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers
revision: str = "011_v1_production_schema"
down_revision: Union[str, None] = "041b326c7e57"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- User Profile enhancements ---
    with op.batch_alter_table("user_profiles") as batch_op:
        batch_op.add_column(sa.Column("phone", sa.String(50), nullable=True))
        batch_op.add_column(sa.Column("profile_photo_url", sa.String(1024), nullable=True))
        batch_op.add_column(sa.Column("education", sa.JSON, nullable=True))
        batch_op.add_column(sa.Column("career_goal", sa.String(500), nullable=True))
        batch_op.add_column(sa.Column("saved_companies", sa.JSON, nullable=True))
        batch_op.add_column(sa.Column("recently_viewed_jobs", sa.JSON, nullable=True))
        batch_op.add_column(sa.Column("weekly_summary_enabled", sa.Boolean, nullable=False, server_default=sa.text("1")))

    # --- Company enhancements ---
    with op.batch_alter_table("companies") as batch_op:
        batch_op.add_column(sa.Column("benefits", sa.JSON, nullable=True))
        batch_op.add_column(sa.Column("tech_stack", sa.JSON, nullable=True))
        batch_op.add_column(sa.Column("verified", sa.Boolean, nullable=False, server_default=sa.text("0")))
        batch_op.add_column(sa.Column("founded_year", sa.Integer, nullable=True))
        batch_op.add_column(sa.Column("employee_count", sa.String(100), nullable=True))
        batch_op.add_column(sa.Column("culture", sa.Text, nullable=True))
        batch_op.add_column(sa.Column("remote_policy", sa.String(100), nullable=True))
        batch_op.add_column(sa.Column("office_locations", sa.JSON, nullable=True))
        batch_op.add_column(sa.Column("social_links", sa.JSON, nullable=True))
        batch_op.add_column(sa.Column("hiring_frequency", sa.String(100), nullable=True))
        batch_op.add_column(sa.Column("avg_response_time", sa.String(100), nullable=True))
        batch_op.add_column(sa.Column("featured", sa.Boolean, nullable=False, server_default=sa.text("0")))

    # --- Job enhancements ---
    with op.batch_alter_table("jobs") as batch_op:
        batch_op.add_column(sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.text("1")))
        batch_op.add_column(sa.Column("featured", sa.Boolean, nullable=False, server_default=sa.text("0")))

    # --- Saved Searches table ---
    op.create_table(
        "saved_searches",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("label", sa.String(255), nullable=False),
        sa.Column("query", sa.String(500), nullable=False),
        sa.Column("filters", sa.JSON, nullable=True),
        sa.Column("notify", sa.Boolean, nullable=False, server_default=sa.text("1")),
        sa.Column("last_notified_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # --- Audit Logs table ---
    op.create_table(
        "audit_logs",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("admin_id", sa.String(36), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True),
        sa.Column("action", sa.String(100), nullable=False, index=True),
        sa.Column("target_type", sa.String(50), nullable=True),
        sa.Column("target_id", sa.String(36), nullable=True),
        sa.Column("details", sa.JSON, nullable=True),
        sa.Column("ip_address", sa.String(45), nullable=True),
        sa.Column("user_agent", sa.String(500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False, index=True),
    )


def downgrade() -> None:
    op.drop_table("audit_logs")
    op.drop_table("saved_searches")

    with op.batch_alter_table("jobs") as batch_op:
        batch_op.drop_column("featured")
        batch_op.drop_column("is_active")

    with op.batch_alter_table("companies") as batch_op:
        batch_op.drop_column("featured")
        batch_op.drop_column("avg_response_time")
        batch_op.drop_column("hiring_frequency")
        batch_op.drop_column("social_links")
        batch_op.drop_column("office_locations")
        batch_op.drop_column("remote_policy")
        batch_op.drop_column("culture")
        batch_op.drop_column("employee_count")
        batch_op.drop_column("founded_year")
        batch_op.drop_column("verified")
        batch_op.drop_column("tech_stack")
        batch_op.drop_column("benefits")

    with op.batch_alter_table("user_profiles") as batch_op:
        batch_op.drop_column("weekly_summary_enabled")
        batch_op.drop_column("recently_viewed_jobs")
        batch_op.drop_column("saved_companies")
        batch_op.drop_column("career_goal")
        batch_op.drop_column("education")
        batch_op.drop_column("profile_photo_url")
        batch_op.drop_column("phone")
