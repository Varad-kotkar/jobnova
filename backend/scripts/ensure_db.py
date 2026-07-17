import os
from sqlalchemy import create_engine
from pathlib import Path

from app.models.base import Base


def ensure_db():
    db_url = os.environ.get("DATABASE_URL", "sqlite+aiosqlite:///./jobnova.db")
    if db_url.startswith("sqlite+aiosqlite://"):
        sync_url = db_url.replace("+aiosqlite", "")
    else:
        sync_url = db_url

    # For file paths, ensure directory exists
    if sync_url.startswith("sqlite:///./"):
        db_path = Path(sync_url.replace("sqlite:///", ""))
        if not db_path.parent.exists():
            db_path.parent.mkdir(parents=True, exist_ok=True)

    engine = create_engine(sync_url, connect_args={"check_same_thread": False})
    Base.metadata.create_all(engine)


if __name__ == "__main__":
    ensure_db()
    print("Database ensured")
