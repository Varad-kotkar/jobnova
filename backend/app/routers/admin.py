from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..core.rbac import require_roles
from ..database.session import get_session
from ..models.company import Company
from ..models.job import Job
from ..models.job_application import JobApplication
from ..models.recruiter import RecruiterProfile
from ..models.user import User

router = APIRouter(prefix="/api/admin", tags=["admin"])


class UpdateRecruiterStatusPayload(BaseModel):
    status: str  # pending, approved, rejected, suspended
    reason: Optional[str] = ""


@router.get("/recruiters", status_code=status.HTTP_200_OK)
async def list_recruiters(
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: User = Depends(require_roles("admin")),
    session: AsyncSession = Depends(get_session),
) -> Dict[str, Any]:
    stmt = (
        select(RecruiterProfile)
        .options(selectinload(RecruiterProfile.user), selectinload(RecruiterProfile.company))
        .order_by(RecruiterProfile.created_at.desc())
    )
    if status_filter:
        stmt = stmt.where(RecruiterProfile.verification_status == status_filter.lower())

    res = await session.execute(stmt)
    profiles = res.scalars().all()

    items = []
    for p in profiles:
        items.append(
            {
                "id": p.id,
                "user_id": p.user_id,
                "full_name": p.user.full_name if p.user else "Unknown",
                "email": p.user.email if p.user else "Unknown",
                "company_name": p.company.name if p.company else (p.job_title or "Company Unlinked"),
                "company_website": p.company_website,
                "linkedin_url": p.linkedin_url,
                "job_title": p.job_title,
                "department": p.department,
                "verification_status": p.verification_status,
                "verification_documents": p.verification_documents or [],
                "created_at": p.created_at.isoformat() if p.created_at else None,
            }
        )

    return {"success": True, "data": items}


@router.patch("/recruiters/{recruiter_id}/status", status_code=status.HTTP_200_OK)
async def update_recruiter_status(
    recruiter_id: str,
    payload: UpdateRecruiterStatusPayload,
    current_user: User = Depends(require_roles("admin")),
    session: AsyncSession = Depends(get_session),
) -> Dict[str, Any]:
    valid_statuses = {"pending", "approved", "rejected", "suspended"}
    new_status = payload.status.lower()
    if new_status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status '{new_status}'. Allowed values: {valid_statuses}",
        )

    stmt = select(RecruiterProfile).where(RecruiterProfile.id == recruiter_id)
    res = await session.execute(stmt)
    profile = res.scalars().first()

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Recruiter profile with ID '{recruiter_id}' not found",
        )

    profile.verification_status = new_status
    await session.commit()

    return {
        "success": True,
        "data": {
            "recruiter_id": profile.id,
            "verification_status": profile.verification_status,
            "message": f"Recruiter status updated to '{new_status}' successfully",
        },
    }


@router.get("/metrics", status_code=status.HTTP_200_OK)
async def get_system_metrics(
    current_user: User = Depends(require_roles("admin")),
    session: AsyncSession = Depends(get_session),
) -> Dict[str, Any]:
    users_count = (await session.execute(select(func.count(User.id)))).scalar_one()
    jobs_count = (await session.execute(select(func.count(Job.id)))).scalar_one()
    apps_count = (await session.execute(select(func.count(JobApplication.id)))).scalar_one()
    companies_count = (await session.execute(select(func.count(Company.id)))).scalar_one()
    pending_recruiters = (
        await session.execute(
            select(func.count(RecruiterProfile.id)).where(RecruiterProfile.verification_status == "pending")
        )
    ).scalar_one()

    return {
        "success": True,
        "data": {
            "total_users": users_count,
            "total_jobs": jobs_count,
            "total_applications": apps_count,
            "total_companies": companies_count,
            "pending_recruiter_reviews": pending_recruiters,
        },
    }
