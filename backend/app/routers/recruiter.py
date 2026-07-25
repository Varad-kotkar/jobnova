from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.rbac import require_roles
from ..core.security import get_current_user
from ..database.session import get_session
from ..models.user import User
from ..services.recruiter_service import RecruiterService

router = APIRouter(prefix="/api/recruiter", tags=["recruiter"])


class CreateRecruiterJobPayload(BaseModel):
    title: str = Field(..., min_length=2)
    description: str = Field(..., min_length=10)
    company_name: str = Field(..., min_length=2)
    location: str = "Remote"
    remote: bool = True
    skills: List[str] = Field(default_factory=list)


class UpdateApplicantStatusPayload(BaseModel):
    new_status: str
    notes: Optional[str] = ""


@router.post("/jobs", status_code=status.HTTP_201_CREATED)
async def create_recruiter_job_endpoint(
    payload: CreateRecruiterJobPayload,
    current_user: User = Depends(require_roles("recruiter", "admin")),
    session: AsyncSession = Depends(get_session),
) -> Dict[str, Any]:
    return await RecruiterService.create_recruiter_job(
        session=session,
        user_id=current_user.id,
        title=payload.title,
        description=payload.description,
        location=payload.location,
        remote=payload.remote,
        skills=payload.skills,
        company_name=payload.company_name,
    )


@router.get("/applications", status_code=status.HTTP_200_OK)
async def get_recruiter_applications_endpoint(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> List[Dict[str, Any]]:
    return await RecruiterService.get_recruiter_applications(
        session=session,
        user_id=current_user.id,
    )


@router.patch("/applications/{id}/status", status_code=status.HTTP_200_OK)
async def update_applicant_status_endpoint(
    id: str,
    payload: UpdateApplicantStatusPayload,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> Dict[str, Any]:
    return await RecruiterService.update_applicant_status(
        session=session,
        user_id=current_user.id,
        application_id=id,
        new_status=payload.new_status,
        notes=payload.notes or "",
    )
