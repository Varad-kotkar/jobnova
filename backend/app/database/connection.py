import logging
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine

from ..models import Base, Company, Job, PluginRun, Source

logger = logging.getLogger(__name__)

_engine: Optional[AsyncEngine] = None


async def connect_to_database(database_url: str) -> None:
    global _engine
    if _engine is None:
        _engine = create_async_engine(database_url, future=True)
        async with _engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database connection established and schema verified successfully")


async def disconnect_from_database() -> None:
    global _engine
    if _engine is not None:
        await _engine.dispose()
        _engine = None
        try:
            # clear cached sessionmaker in session module so new engine creates a fresh one
            from . import session as _session_mod

            _session_mod._async_session = None
        except Exception:
            pass


def get_engine() -> AsyncEngine:
    if _engine is None:
        raise RuntimeError("Database engine is not initialized")
    return _engine

