from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.plugin_loader import load_plugins
from ..database.session import get_session
from ..models.job import Job

router = APIRouter(prefix="/health", tags=["health"])


@router.get("/live", status_code=status.HTTP_200_OK)
async def live() -> dict[str, str]:
    return {"status": "alive"}


@router.get("/ready", status_code=status.HTTP_200_OK)
async def ready(session: AsyncSession = Depends(get_session)) -> dict[str, str]:
    try:
        # Check DB connection & table accessibility
        result = await session.execute(select(func.count()).select_from(Job))
        job_count = result.scalar_one()

        # Check scrapers
        plugins = load_plugins()

        return {
            "status": "ready",
            "database": "connected",
            "tables_exist": True,
            "job_count": str(job_count),
            "plugins_loaded": str(len(plugins)),
        }
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Service not ready: {exc}",
        ) from exc

