import pytest
from fastapi import status
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.anyio
async def test_root_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["status"] == "ok"
        assert data["docs"] == "/docs"
        assert data["openapi"] == "/openapi.json"


@pytest.mark.anyio
async def test_root_head_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.head("/")
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.anyio
async def test_openapi_schema_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/openapi.json")
        assert response.status_code == status.HTTP_200_OK
        schema = response.json()
        assert "openapi" in schema or "swagger" in schema
        assert "/api/memes" in schema["paths"]
        assert "/api/homepage/sections" in schema["paths"]
        assert "/api/ingestion/status" in schema["paths"]
        assert "/" in schema["paths"]


@pytest.mark.anyio
async def test_docs_swagger_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/docs")
        assert response.status_code == status.HTTP_200_OK
        assert "html" in response.headers.get("content-type", "").lower()
        # Verify CSP header allows CDN resources so Swagger UI renders cleanly
        csp = response.headers.get("content-security-policy", "")
        assert "cdn.jsdelivr.net" in csp


@pytest.mark.anyio
async def test_memes_public_endpoint(async_session):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/memes")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["success"] is True
        assert isinstance(data["data"], list)


@pytest.mark.anyio
async def test_homepage_sections_public_endpoint(async_session):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/homepage/sections")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["success"] is True
        assert isinstance(data["data"], list)


@pytest.mark.anyio
async def test_ingestion_status_endpoint(async_session):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/ingestion/status")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["success"] is True
        assert "data" in data
