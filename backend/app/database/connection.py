import logging
import re
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine

from ..config.database import sanitize_async_database_url
from ..models import Base

logger = logging.getLogger(__name__)

_engine: Optional[AsyncEngine] = None


def mask_db_url(url: str) -> str:
    """Masks database passwords for clean logging output."""
    return re.sub(r":([^@]+)@", r":****@", url)


async def connect_to_database(raw_database_url: str) -> None:
    global _engine
    if _engine is None:
        clean_url, connect_args = sanitize_async_database_url(raw_database_url)
        masked_url = mask_db_url(clean_url)
        logger.info(
            f"Initializing async database engine: url={masked_url}, connect_args={connect_args}"
        )

        if connect_args:
            _engine = create_async_engine(clean_url, connect_args=connect_args, future=True)
        else:
            _engine = create_async_engine(clean_url, future=True)

        async with _engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        logger.info("Database connection established and schema verified successfully")


async def disconnect_from_database() -> None:
    global _engine
    if _engine is not None:
        await _engine.dispose()
        _engine = None
        try:
            from . import session as _session_mod

            _session_mod._async_session = None
        except Exception:
            pass


def get_engine() -> AsyncEngine:
    if _engine is None:
        raise RuntimeError("Database engine is not initialized")
    return _engine
