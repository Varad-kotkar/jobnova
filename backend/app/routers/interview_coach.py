from typing import Any, Dict

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.security import get_current_user
from ..database.session import get_session
from ..models.user import User
from ..services.interview_coach_service import InterviewCoachService

router = APIRouter(prefix="/api/jobs", tags=["interview-coach"])


@router.post("/{id}/interview-prep", status_code=status.HTTP_200_OK)
async def generate_interview_prep_endpoint(
    id: str,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> Dict[str, Any]:
    return await InterviewCoachService.generate_interview_prep(
        session=session,
        user_id=current_user.id,
        job_id=id,
    )


@router.get("/{id}/interview-prep", status_code=status.HTTP_200_OK)
async def get_interview_prep_endpoint(
    id: str,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> Dict[str, Any]:
    return await InterviewCoachService.generate_interview_prep(
        session=session,
        user_id=current_user.id,
        job_id=id,
    )
