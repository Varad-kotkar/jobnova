from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.security import get_current_user
from ..database.session import get_session
from ..models.user import User
from ..services.application_service import ApplicationService

router = APIRouter(prefix="/api/applications", tags=["applications"])


class CreateApplicationPayload(BaseModel):
    job_id: str
    status: Optional[str] = "Applied"
    source: Optional[str] = "JobNova Portal"
    cover_letter: Optional[str] = None
    notes: Optional[str] = None
    priority: Optional[str] = "Medium"


class UpdateStatusPayload(BaseModel):
    status: str
    notes: Optional[str] = None


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_application_endpoint(
    payload: CreateApplicationPayload,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> Dict[str, Any]:
    return await ApplicationService.create_application(
        session=session,
        user_id=current_user.id,
        job_id=payload.job_id,
        payload=payload.model_dump(),
    )


@router.get("/", status_code=status.HTTP_200_OK)
async def list_applications_endpoint(
    status_filter: Optional[str] = Query(None, alias="status"),
    archived: bool = Query(False),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> List[Dict[str, Any]]:
    return await ApplicationService.get_user_applications(
        session=session,
        user_id=current_user.id,
        status_filter=status_filter,
        archived=archived,
    )


@router.get("/{id}", status_code=status.HTTP_200_OK)
async def get_application_endpoint(
    id: str,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> Dict[str, Any]:
    return await ApplicationService.get_application_detail(
        session=session,
        user_id=current_user.id,
        application_id=id,
    )


@router.patch("/{id}/status", status_code=status.HTTP_200_OK)
async def update_application_status_endpoint(
    id: str,
    payload: UpdateStatusPayload,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> Dict[str, Any]:
    return await ApplicationService.update_application_status(
        session=session,
        user_id=current_user.id,
        application_id=id,
        new_status=payload.status,
        notes=payload.notes,
    )


@router.delete("/{id}", status_code=status.HTTP_200_OK)
async def delete_application_endpoint(
    id: str,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> Dict[str, Any]:
    return await ApplicationService.delete_application(
        session=session,
        user_id=current_user.id,
        application_id=id,
    )
