import pytest

from app.routers.health import live


@pytest.mark.anyio
async def test_live_endpoint():
    resp = await live()
    assert resp == {"status": "alive"}
