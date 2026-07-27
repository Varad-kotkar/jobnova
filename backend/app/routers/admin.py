from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..core.rbac import require_roles
from ..database.session import get_session
from ..models.audit_log import AuditLog
from ..models.company import Company
from ..models.job import Job
from ..models.job_application import JobApplication
from ..models.recruiter import RecruiterProfile
from ..models.user import User

router = APIRouter(prefix="/api/admin", tags=["admin"])


class UpdateRecruiterStatusPayload(BaseModel):
    status: str  # pending, approved, rejected, suspended
    reason: Optional[str] = ""


class UpdateUserStatusPayload(BaseModel):
    is_active: Optional[bool] = None
    role: Optional[str] = None


class UpdateJobStatusPayload(BaseModel):
    is_active: Optional[bool] = None
    featured: Optional[bool] = None


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

    # Record Audit Log
    log_entry = AuditLog(
        admin_id=current_user.id,
        action="recruiter.update_status",
        target_type="recruiter",
        target_id=recruiter_id,
        details={"status": new_status, "reason": payload.reason},
    )
    session.add(log_entry)
    await session.commit()

    return {
        "success": True,
        "data": {
            "recruiter_id": profile.id,
            "verification_status": profile.verification_status,
            "message": f"Recruiter status updated to '{new_status}' successfully",
        },
    }


@router.patch("/users/{user_id}/status", status_code=status.HTTP_200_OK)
async def update_user_status(
    user_id: str,
    payload: UpdateUserStatusPayload,
    current_user: User = Depends(require_roles("admin")),
    session: AsyncSession = Depends(get_session),
) -> Dict[str, Any]:
    stmt = select(User).where(User.id == user_id)
    res = await session.execute(stmt)
    target_user = res.scalars().first()

    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if payload.is_active is not None:
        target_user.is_active = payload.is_active
    if payload.role in {"candidate", "recruiter", "admin"}:
        target_user.role = payload.role

    log_entry = AuditLog(
        admin_id=current_user.id,
        action="user.update_status",
        target_type="user",
        target_id=user_id,
        details={"is_active": target_user.is_active, "role": target_user.role},
    )
    session.add(log_entry)
    await session.commit()

    return {"success": True, "message": f"User {user_id} updated successfully"}


@router.patch("/jobs/{job_id}/status", status_code=status.HTTP_200_OK)
async def update_job_status(
    job_id: str,
    payload: UpdateJobStatusPayload,
    current_user: User = Depends(require_roles("admin")),
    session: AsyncSession = Depends(get_session),
) -> Dict[str, Any]:
    stmt = select(Job).where(Job.id == job_id)
    res = await session.execute(stmt)
    job = res.scalars().first()

    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    if payload.is_active is not None:
        job.is_active = payload.is_active
    if payload.featured is not None:
        job.featured = payload.featured

    log_entry = AuditLog(
        admin_id=current_user.id,
        action="job.update_status",
        target_type="job",
        target_id=job_id,
        details={"is_active": job.is_active, "featured": job.featured},
    )
    session.add(log_entry)
    await session.commit()

    return {"success": True, "message": f"Job {job_id} updated successfully"}


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


@router.get("/telegram/settings", status_code=status.HTTP_200_OK)
async def get_telegram_settings(
    current_user: User = Depends(require_roles("admin")),
) -> Dict[str, Any]:
    from ..services.telegram_service import TelegramService
    token, channel_id = TelegramService.get_credentials()
    logs = TelegramService.get_logs()
    return {
        "success": True,
        "data": {
            "is_configured": bool(token and channel_id),
            "channel_id": channel_id or "Not configured",
            "bot_configured": bool(token),
            "recent_logs": logs,
        },
    }


@router.post("/telegram/test", status_code=status.HTTP_200_OK)
async def trigger_telegram_test(
    channel_override: Optional[str] = Query(None),
    current_user: User = Depends(require_roles("admin")),
) -> Dict[str, Any]:
    from ..services.telegram_service import TelegramService
    result = await TelegramService.send_test_message(channel_override)
    return {"success": True, "result": result}


@router.delete("/jobs/{job_id}", status_code=status.HTTP_200_OK)
async def delete_job_admin(
    job_id: str,
    current_user: User = Depends(require_roles("admin")),
    session: AsyncSession = Depends(get_session),
) -> Dict[str, Any]:
    stmt = select(Job).where(Job.id == job_id)
    res = await session.execute(stmt)
    job = res.scalars().first()

    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    await session.delete(job)

    log_entry = AuditLog(
        admin_id=current_user.id,
        action="job.delete",
        target_type="job",
        target_id=job_id,
        details={"title": job.title},
    )
    session.add(log_entry)
    await session.commit()
    return {"success": True, "message": f"Job {job_id} deleted successfully by admin."}
