import sqlite3
import pytest
import sqlalchemy as sa
from alembic.config import Config
from alembic import command


def test_alembic_fresh_database_has_varchar_255_version_column(tmp_path):
    """Verify fresh database creation creates alembic_version with VARCHAR(255) version_num column."""
    db_file = tmp_path / "test_fresh_255.db"
    db_url = f"sqlite+aiosqlite:///{db_file}"

    cfg = Config("alembic.ini")
    cfg.set_main_option("sqlalchemy.url", db_url)
    command.upgrade(cfg, "head")

    conn = sqlite3.connect(str(db_file))
    cursor = conn.cursor()
    cursor.execute("SELECT sql FROM sqlite_master WHERE name='alembic_version'")
    ddl_row = cursor.fetchone()
    cursor.execute("SELECT version_num FROM alembic_version")
    rev_row = cursor.fetchone()
    conn.close()

    assert ddl_row is not None
    assert "VARCHAR(255)" in ddl_row[0]
    assert rev_row is not None
    assert rev_row[0] == "015_add_homepage_sections"


def test_ensure_version_column_capacity_postgresql_ddl():
    """Verify PostgreSQL ALTER COLUMN DDL is executed when dialect is postgresql."""
    from migrations.env import ensure_version_column_capacity

    executed_sqls = []

    class MockDialect:
        name = "postgresql"

    class MockConnection:
        dialect = MockDialect()

        def execute(self, stmt):
            executed_sqls.append(str(stmt))

    mock_conn = MockConnection()
    ensure_version_column_capacity(mock_conn)

    assert len(executed_sqls) == 1
    assert "ALTER TABLE alembic_version ALTER COLUMN version_num TYPE VARCHAR(255)" in executed_sqls[0]
