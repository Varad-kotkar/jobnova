from typing import Any, Dict

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.security import get_current_user
from ..database.session import get_session
from ..models.user import User
from ..services.career_coach_service import CareerCoachService

router = APIRouter(prefix="/api/users/career-roadmap", tags=["career-coach"])


@router.get("", status_code=status.HTTP_200_OK)
async def get_career_roadmap_endpoint(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> Dict[str, Any]:
    return await CareerCoachService.generate_career_roadmap(
        session=session,
        user_id=current_user.id,
    )


@router.post("/generate", status_code=status.HTTP_200_OK)
async def generate_career_roadmap_endpoint(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> Dict[str, Any]:
    return await CareerCoachService.generate_career_roadmap(
        session=session,
        user_id=current_user.id,
    )
