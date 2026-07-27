import os
from sqlalchemy import create_engine
from pathlib import Path

from app.models.base import Base


def ensure_db():
    from alembic.config import Config
    from alembic import command
    root_dir = Path(__file__).resolve().parent.parent
    alembic_cfg = Config(str(root_dir / "alembic.ini"))
    alembic_cfg.set_main_option("script_location", str(root_dir / "migrations"))
    command.upgrade(alembic_cfg, "head")


if __name__ == "__main__":
    ensure_db()
    print("Database ensured via Alembic migrations")
