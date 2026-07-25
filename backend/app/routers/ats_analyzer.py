from typing import Any, Dict, Optional

from pydantic import BaseModel
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.security import get_current_user
from ..database.session import get_session
from ..models.user import User
from ..services.ats_analyzer_service import ATSAnalyzerService

router = APIRouter(prefix="/api/users/resume/ats-score", tags=["ats-analyzer"])


class AnalyzePayload(BaseModel):
    job_id: str


@router.get("", status_code=status.HTTP_200_OK)
async def get_ats_score_endpoint(
    job_id: str = Query(...),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> Dict[str, Any]:
    return await ATSAnalyzerService.analyze_resume_for_job(
        session=session,
        user_id=current_user.id,
        job_id=job_id,
    )


@router.post("/analyze", status_code=status.HTTP_200_OK)
async def post_ats_score_endpoint(
    payload: AnalyzePayload,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> Dict[str, Any]:
    return await ATSAnalyzerService.analyze_resume_for_job(
        session=session,
        user_id=current_user.id,
        job_id=payload.job_id,
    )
