import asyncio
import os
import sys
from typing import AsyncGenerator

import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from pathlib import Path
import sys

# Ensure the backend package is importable as `app`
ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
# Provide a sane default for tests so pydantic settings validate during import
os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///:memory:")

from app.database.connection import connect_to_database, disconnect_from_database, get_engine
from app.models.base import Base
from app.main import create_application
from app.database.session import get_async_sessionmaker


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture()
def initialized_db(tmp_path_factory) -> str:
    db_file = tmp_path_factory.mktemp("data") / f"test_{uuid.uuid4()}.db"
    db_url = f"sqlite+aiosqlite:///{db_file}"

    async def _init():
        await connect_to_database(db_url)
        engine = get_engine()
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

    asyncio.run(_init())

    yield db_url

    asyncio.run(disconnect_from_database())


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture
async def async_session(initialized_db) -> AsyncGenerator[AsyncSession, None]:
    Session = get_async_sessionmaker()
    async with Session() as session:
        yield session


@pytest.fixture
async def app_client(initialized_db, monkeypatch):
    # Prevent the app lifespan from creating/closing the engine (we manage it in fixtures)
    import app.main as main_mod

    monkeypatch.setattr(main_mod, "connect_to_database", lambda *_: None)
    monkeypatch.setattr(main_mod, "disconnect_from_database", lambda *_: None)

    app = create_application()
    from fastapi.testclient import TestClient

    client = TestClient(app)

    class TestClientAdapter:
        def __init__(self, client):
            self._client = client

        async def get(self, *args, **kwargs):
            import anyio

            return await anyio.to_thread.run_sync(lambda: self._client.get(*args, **kwargs))

        async def post(self, *args, **kwargs):
            import anyio

            return await anyio.to_thread.run_sync(lambda: self._client.post(*args, **kwargs))

    adapter = TestClientAdapter(client)
    try:
        yield adapter
    finally:
        client.close()
