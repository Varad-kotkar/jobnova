from typing import Any, Dict, Optional

from pydantic import BaseModel
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.security import get_current_user
from ..database.session import get_session
from ..models.user import User
from ..services.cover_letter_service import CoverLetterService

router = APIRouter(prefix="/api/jobs", tags=["cover-letter"])


class CoverLetterPayload(BaseModel):
    tone: Optional[str] = "Professional"


@router.post("/{id}/cover-letter", status_code=status.HTTP_200_OK)
async def generate_cover_letter_endpoint(
    id: str,
    payload: Optional[CoverLetterPayload] = None,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> Dict[str, Any]:
    selected_tone = payload.tone if payload and payload.tone else "Professional"
    return await CoverLetterService.generate_cover_letter(
        session=session,
        user_id=current_user.id,
        job_id=id,
        tone=selected_tone,
    )
