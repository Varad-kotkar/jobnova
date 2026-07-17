from typing import AsyncGenerator, Optional

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from .connection import get_engine

_async_session: Optional[async_sessionmaker[AsyncSession]] = None


def get_async_sessionmaker() -> async_sessionmaker[AsyncSession]:
    global _async_session
    if _async_session is None:
        _async_session = async_sessionmaker(bind=get_engine(), expire_on_commit=False, class_=AsyncSession)
    return _async_session


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    sessionmaker = get_async_sessionmaker()
    async with sessionmaker() as session:
        yield session
