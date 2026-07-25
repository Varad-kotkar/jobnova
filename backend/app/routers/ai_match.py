from typing import Any, Dict, List

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.security import get_current_user
from ..database.session import get_session
from ..models.user import User
from ..services.ai_match_service import AIMatchService

router = APIRouter(prefix="/api/jobs", tags=["ai-match"])


@router.get("/{id}/match-score", status_code=status.HTTP_200_OK)
async def get_job_match_score(
    id: str,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> Dict[str, Any]:
    cache_key = f"match:{current_user.id}:{id}"
    from ..core.cache import CacheManager
    cached_score = await CacheManager.get(cache_key)
    if cached_score:
        return cached_score

    result = await AIMatchService.calculate_job_match(
        session=session,
        user_id=current_user.id,
        job_id=id,
    )
    await CacheManager.set(cache_key, result, ttl_seconds=900)
    return result


@router.get("/recommendations", status_code=status.HTTP_200_OK)
async def get_recommended_jobs(
    limit: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> List[Dict[str, Any]]:
    return await AIMatchService.get_top_recommended_jobs(
        session=session,
        user_id=current_user.id,
        limit=limit,
    )
