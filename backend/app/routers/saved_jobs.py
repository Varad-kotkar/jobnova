from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.security import get_current_user
from ..database.session import get_session
from ..models.user import User
from ..services.saved_job_service import SavedJobService

router = APIRouter(tags=["saved-jobs"])


class SaveJobPayload(BaseModel):
    notes: Optional[str] = None


@router.post("/api/jobs/{id}/save", status_code=status.HTTP_200_OK)
async def save_job_endpoint(
    id: str,
    payload: Optional[SaveJobPayload] = None,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> Dict[str, Any]:
    notes = payload.notes if payload else None
    return await SavedJobService.save_job(
        session=session,
        user_id=current_user.id,
        job_id=id,
        notes=notes,
    )


@router.delete("/api/jobs/{id}/save", status_code=status.HTTP_200_OK)
async def remove_saved_job_endpoint(
    id: str,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> Dict[str, Any]:
    return await SavedJobService.remove_saved_job(
        session=session,
        user_id=current_user.id,
        job_id=id,
    )


@router.get("/api/saved-jobs", status_code=status.HTTP_200_OK)
async def list_saved_jobs_endpoint(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> List[Dict[str, Any]]:
    return await SavedJobService.get_saved_jobs(session=session, user_id=current_user.id)


@router.get("/api/saved-jobs/ids", status_code=status.HTTP_200_OK)
async def get_saved_job_ids_endpoint(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> List[str]:
    return await SavedJobService.get_saved_job_ids(session=session, user_id=current_user.id)
