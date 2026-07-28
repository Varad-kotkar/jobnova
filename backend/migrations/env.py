import asyncio
from logging.config import fileConfig
from pathlib import Path
import sys
from typing import Any

from sqlalchemy import pool, Column, MetaData, PrimaryKeyConstraint, String, Table, inspect, text
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import create_async_engine

from alembic import context
from alembic.ddl.impl import DefaultImpl

# Ensure app package is importable
ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.models import Base
from app.config.database import database_settings, sanitize_async_database_url

# ──────────────────────────────────────────────────────────────────────────────
# Permanent Fix for alembic_version.version_num column length:
# Override DefaultImpl.version_table_impl so Alembic creates alembic_version
# with VARCHAR(255) instead of hardcoded VARCHAR(32). This supports revision
# identifiers longer than 32 characters (e.g. 012_add_job_classification_fields).
# ──────────────────────────────────────────────────────────────────────────────
_orig_version_table_impl = DefaultImpl.version_table_impl


def custom_version_table_impl(
    self,
    *,
    version_table: str,
    version_table_schema: str | None,
    version_table_pk: bool,
    **kw: Any,
) -> Table:
    """Create alembic_version table with VARCHAR(255) version_num column."""
    vt = Table(
        version_table,
        MetaData(),
        Column("version_num", String(255), nullable=False),
        schema=version_table_schema,
    )
    if version_table_pk:
        vt.append_constraint(
            PrimaryKeyConstraint("version_num", name=f"{version_table}_pkc")
        )
    return vt


DefaultImpl.version_table_impl = custom_version_table_impl


def ensure_version_column_capacity(connection: Connection) -> None:
    """Idempotently alters existing alembic_version.version_num to VARCHAR(255)

    on PostgreSQL / existing databases where it was previously created as VARCHAR(32).
    """
    try:
        if connection.dialect.name == "postgresql":
            connection.execute(
                text("ALTER TABLE alembic_version ALTER COLUMN version_num TYPE VARCHAR(255);")
            )
    except Exception as exc:
        import logging
        logging.getLogger("alembic.env").debug(
            "Ignored exception during alembic_version alter capacity (table may not exist yet): %s", exc
        )


target_metadata = Base.metadata


def get_configured_db_url() -> tuple[str, dict]:
    cfg = getattr(context, "config", None)
    url = cfg.get_main_option("sqlalchemy.url") if cfg else None
    if not url or "driver://" in url:
        url = database_settings.database_url
    clean_url, connect_args = sanitize_async_database_url(url)
    if cfg:
        cfg.set_main_option("sqlalchemy.url", clean_url)
    return clean_url, connect_args


def run_migrations_offline() -> None:
    clean_url, _ = get_configured_db_url()
    context.configure(
        url=clean_url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        render_as_batch=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    ensure_version_column_capacity(connection)
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        render_as_batch=True,
    )

    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    clean_url, connect_args = get_configured_db_url()
    if connect_args:
        connectable = create_async_engine(clean_url, connect_args=connect_args, poolclass=pool.NullPool)
    else:
        connectable = create_async_engine(clean_url, poolclass=pool.NullPool)

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
        await connection.commit()

    await connectable.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


if getattr(context, "config", None) is not None:
    cfg = context.config
    if cfg.config_file_name is not None:
        fileConfig(cfg.config_file_name)
    if context.is_offline_mode():
        run_migrations_offline()
    else:
        run_migrations_online()
