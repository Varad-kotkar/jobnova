from typing import Any, Dict
from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.orchestrator import PluginOrchestrator
from ..database.session import get_session
from ..models.plugin_run import PluginRun

router = APIRouter(prefix="/api/ingestion", tags=["ingestion"])


@router.post("/run", status_code=status.HTTP_200_OK)
async def run_ingestion():
    orchestrator = PluginOrchestrator()
    await orchestrator.initialize()
    results = await orchestrator.run()
    return {
        "inserted": results.inserted,
        "updated": results.updated,
        "duplicates": results.duplicates,
        "errors": results.errors,
    }


@router.get("/status", status_code=status.HTTP_200_OK)
async def get_plugin_health_status(
    session: AsyncSession = Depends(get_session),
) -> Dict[str, Any]:
    """Returns status dashboard breakdown for all ATS ingestion plugins."""
    stmt = (
        select(PluginRun)
        .order_by(PluginRun.finished_at.desc(), PluginRun.started_at.desc())
        .limit(100)
    )
    res = await session.execute(stmt)
    runs = res.scalars().all()

    latest_per_plugin: Dict[str, Dict[str, Any]] = {}
    for r in runs:
        if r.plugin_name not in latest_per_plugin:
            latest_per_plugin[r.plugin_name] = {
                "plugin_name": r.plugin_name,
                "status": r.status,
                "jobs_fetched": r.jobs_fetched,
                "jobs_inserted": r.jobs_inserted,
                "duration_ms": r.duration_ms,
                "finished_at": r.finished_at.isoformat() if r.finished_at else None,
                "error": r.error,
            }

    return {
        "success": True,
        "plugins_count": len(latest_per_plugin),
        "data": list(latest_per_plugin.values()),
    }
