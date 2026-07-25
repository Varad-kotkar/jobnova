from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from ..database.session import get_session
from ..core.orchestrator import PluginOrchestrator

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
