from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.cache import CacheManager
from ..core.plugin_loader import load_plugins
from ..core.telemetry import TelemetryService
from ..database.session import get_session
from ..models.job import Job

router = APIRouter(prefix="/health", tags=["health"])


@router.get("", status_code=status.HTTP_200_OK)
@router.get("/", status_code=status.HTTP_200_OK)
async def health_check(session: AsyncSession = Depends(get_session)) -> Dict[str, Any]:
    db_status = "unhealthy"
    job_count = 0
    try:
        res = await session.execute(select(func.count()).select_from(Job))
        job_count = res.scalar_one()
        db_status = "healthy"
    except Exception as exc:
        db_status = f"unhealthy: {exc}"

    cache_status = "healthy"

    return {
        "status": "healthy" if db_status == "healthy" else "degraded",
        "database": db_status,
        "cache": cache_status,
        "job_count": job_count,
        "uptime_seconds": round(TelemetryService.get_uptime_seconds(), 2),
        "version": "1.0.0",
    }


@router.get("/live", status_code=status.HTTP_200_OK)
async def live() -> Dict[str, str]:
    return {"status": "alive"}


@router.get("/ready", status_code=status.HTTP_200_OK)
async def ready(session: AsyncSession = Depends(get_session)) -> Dict[str, Any]:
    try:
        result = await session.execute(select(func.count()).select_from(Job))
        job_count = result.scalar_one()
        plugins = load_plugins()

        return {
            "status": "ready",
            "database": "connected",
            "tables_exist": True,
            "job_count": job_count,
            "plugins_loaded": len(plugins),
        }
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Service not ready: {exc}",
        ) from exc
