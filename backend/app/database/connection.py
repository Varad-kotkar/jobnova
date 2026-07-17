from typing import Optional

from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine

from ..config.settings import settings

_engine: Optional[AsyncEngine] = None


async def connect_to_database() -> None:
    global _engine
    if _engine is None and settings.database_url:
        _engine = create_async_engine(settings.database_url, future=True)


async def disconnect_from_database() -> None:
    global _engine
    if _engine is not None:
        await _engine.dispose()
        _engine = None


def get_engine() -> AsyncEngine:
    if _engine is None:
        raise RuntimeError("Database engine is not initialized")
    return _engine
