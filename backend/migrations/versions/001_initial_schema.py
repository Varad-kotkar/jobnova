"""initial schema

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-07-25 14:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "001_initial_schema"
down_revision: Union[str, None] = None
branch_labels: Union[Sequence[str], None] = None
depends_on: Union[Sequence[str], None] = None


def upgrade() -> None:
    # sources
    op.create_table(
        "sources",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("metadata", sa.JSON(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name", name="uq_sources_name"),
    )
    op.create_index(op.f("ix_sources_name"), "sources", ["name"], unique=True)

    # companies
    op.create_table(
        "companies",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name", name="uq_companies_name"),
    )
    op.create_index(op.f("ix_companies_name"), "companies", ["name"], unique=True)

    # jobs
    op.create_table(
        "jobs",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("source_id", sa.String(length=36), nullable=False),
        sa.Column("company_id", sa.String(length=36), nullable=False),
        sa.Column("title", sa.String(length=512), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("location", sa.String(length=255), nullable=False),
        sa.Column("apply_url", sa.String(length=2048), nullable=False),
        sa.Column("slug", sa.String(length=1024), nullable=False),
        sa.Column("skills", sa.JSON(), nullable=False),
        sa.Column("remote", sa.Boolean(), nullable=False),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"]),
        sa.ForeignKeyConstraint(["source_id"], ["sources.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("slug", name="uq_jobs_slug"),
        sa.UniqueConstraint("apply_url", name="uq_jobs_apply_url"),
    )
    op.create_index(op.f("ix_jobs_apply_url"), "jobs", ["apply_url"], unique=True)
    op.create_index(op.f("ix_jobs_company_id"), "jobs", ["company_id"], unique=False)
    op.create_index(op.f("ix_jobs_slug"), "jobs", ["slug"], unique=False)
    op.create_index(op.f("ix_jobs_source_id"), "jobs", ["source_id"], unique=False)
    op.create_index(op.f("ix_jobs_published_at"), "jobs", ["published_at"], unique=False)
    op.create_index(op.f("ix_jobs_location"), "jobs", ["location"], unique=False)
    op.create_index(op.f("ix_jobs_remote"), "jobs", ["remote"], unique=False)

    # plugin_runs
    op.create_table(
        "plugin_runs",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("plugin_name", sa.String(length=255), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("jobs_fetched", sa.Integer(), nullable=False),
        sa.Column("jobs_inserted", sa.Integer(), nullable=False),
        sa.Column("error", sa.Text(), nullable=True),
        sa.Column("duration_ms", sa.Integer(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_plugin_runs_plugin_name"), "plugin_runs", ["plugin_name"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_plugin_runs_plugin_name"), table_name="plugin_runs")
    op.drop_table("plugin_runs")
    op.drop_index(op.f("ix_jobs_remote"), table_name="jobs")
    op.drop_index(op.f("ix_jobs_location"), table_name="jobs")
    op.drop_index(op.f("ix_jobs_published_at"), table_name="jobs")
    op.drop_index(op.f("ix_jobs_source_id"), table_name="jobs")
    op.drop_index(op.f("ix_jobs_slug"), table_name="jobs")
    op.drop_index(op.f("ix_jobs_company_id"), table_name="jobs")
    op.drop_index(op.f("ix_jobs_apply_url"), table_name="jobs")
    op.drop_table("jobs")
    op.drop_index(op.f("ix_companies_name"), table_name="companies")
    op.drop_table("companies")
    op.drop_index(op.f("ix_sources_name"), table_name="sources")
    op.drop_table("sources")
