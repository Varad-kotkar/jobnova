import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app


@pytest.mark.anyio
async def test_health_diagnostics_endpoint(async_session):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/health")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] in ("healthy", "degraded")
        assert "database" in data
        assert "cache" in data
        assert "uptime_seconds" in data
        assert "version" in data


@pytest.mark.anyio
async def test_observability_middleware_headers():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/health/live")
        assert res.status_code == 200
        assert "X-Request-ID" in res.headers
        assert "X-Response-Time" in res.headers
        assert "Content-Security-Policy" in res.headers
        assert "Permissions-Policy" in res.headers


@pytest.mark.anyio
async def test_prometheus_metrics_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/metrics")
        assert res.status_code == 200
        content = res.text
        assert "jobnova_http_requests_total" in content
        assert "jobnova_uptime_seconds" in content
