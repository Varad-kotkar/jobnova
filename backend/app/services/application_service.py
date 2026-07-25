from __future__ import annotations

from datetime import datetime
import logging
from typing import Any, Dict, List, Optional

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..models.application_status_history import ApplicationStatusHistory
from ..models.job import Job
from ..models.job_application import JobApplication

logger = logging.getLogger("backend.app.application_service")


class ApplicationService:
    @staticmethod
    async def create_application(
        session: AsyncSession,
        user_id: str,
        job_id: str,
        payload: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        payload = payload or {}

        # Verify job exists
        job_res = await session.execute(select(Job).where(Job.id == job_id))
        job = job_res.scalars().first()
        if not job:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job listing not found")

        # Check existing application
        existing_res = await session.execute(
            select(JobApplication).where((JobApplication.user_id == user_id) & (JobApplication.job_id == job_id))
        )
        existing = existing_res.scalars().first()
        if existing:
            return await ApplicationService.get_application_detail(session, user_id, existing.id)

        initial_status = payload.get("status", "Applied")
        app_record = JobApplication(
            user_id=user_id,
            job_id=job_id,
            status=initial_status,
            source=payload.get("source", "JobNova Portal"),
            cover_letter=payload.get("cover_letter"),
            notes=payload.get("notes"),
            salary_offered=payload.get("salary_offered"),
            priority=payload.get("priority", "Medium"),
        )
        session.add(app_record)
        await session.flush()

        # Log initial status history entry
        history_entry = ApplicationStatusHistory(
            application_id=app_record.id,
            previous_status=None,
            new_status=initial_status,
            notes="Application submitted via JobNova",
        )
        session.add(history_entry)
        await session.commit()

        return await ApplicationService.get_application_detail(session, user_id, app_record.id)

    @staticmethod
    async def update_application_status(
        session: AsyncSession,
        user_id: str,
        application_id: str,
        new_status: str,
        notes: Optional[str] = None,
    ) -> Dict[str, Any]:
        query = select(JobApplication).where(
            (JobApplication.id == application_id) & (JobApplication.user_id == user_id)
        )
        res = await session.execute(query)
        app_record = res.scalars().first()

        if not app_record:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application record not found")

        old_status = app_record.status
        if old_status != new_status:
            app_record.status = new_status
            history_entry = ApplicationStatusHistory(
                application_id=app_record.id,
                previous_status=old_status,
                new_status=new_status,
                notes=notes or f"Status updated to {new_status}",
            )
            session.add(history_entry)
            await session.commit()

        return await ApplicationService.get_application_detail(session, user_id, app_record.id)

    @staticmethod
    async def get_user_applications(
        session: AsyncSession,
        user_id: str,
        status_filter: Optional[str] = None,
        archived: bool = False,
    ) -> List[Dict[str, Any]]:
        query = (
            select(JobApplication)
            .options(selectinload(JobApplication.job).selectinload(Job.company))
            .where((JobApplication.user_id == user_id) & (JobApplication.archived == archived))
            .order_by(JobApplication.applied_at.desc())
        )

        if status_filter:
            query = query.where(JobApplication.status == status_filter)

        res = await session.execute(query)
        records = res.scalars().all()

        results = []
        for rec in records:
            job = rec.job
            results.append(
                {
                    "id": rec.id,
                    "job_id": rec.job_id,
                    "status": rec.status,
                    "source": rec.source,
                    "priority": rec.priority,
                    "applied_at": rec.applied_at.isoformat() if rec.applied_at else None,
                    "updated_at": rec.updated_at.isoformat() if rec.updated_at else None,
                    "job": {
                        "id": job.id if job else rec.job_id,
                        "slug": job.slug if job else "job",
                        "title": job.title if job else "Software Engineer",
                        "company": job.company.name if job and job.company else "Tech Company",
                        "location": job.location if job else "Remote",
                    },
                }
            )

        return results

    @staticmethod
    async def get_application_detail(
        session: AsyncSession,
        user_id: str,
        application_id: str,
    ) -> Dict[str, Any]:
        query = (
            select(JobApplication)
            .options(
                selectinload(JobApplication.job).selectinload(Job.company),
                selectinload(JobApplication.history),
            )
            .where((JobApplication.id == application_id) & (JobApplication.user_id == user_id))
        )
        res = await session.execute(query)
        rec = res.scalars().first()

        if not rec:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application record not found")

        job = rec.job
        sorted_history = sorted(rec.history, key=lambda h: (h.changed_at if h.changed_at else datetime.min, h.id), reverse=True)
        history_items = [
            {
                "id": h.id,
                "previous_status": h.previous_status,
                "new_status": h.new_status,
                "notes": h.notes,
                "changed_at": h.changed_at.isoformat() if h.changed_at else None,
            }
            for h in sorted_history
        ]

        return {
            "id": rec.id,
            "job_id": rec.job_id,
            "status": rec.status,
            "source": rec.source,
            "cover_letter": rec.cover_letter,
            "notes": rec.notes,
            "interview_date": rec.interview_date.isoformat() if rec.interview_date else None,
            "salary_offered": rec.salary_offered,
            "priority": rec.priority,
            "follow_up_date": rec.follow_up_date.isoformat() if rec.follow_up_date else None,
            "archived": rec.archived,
            "applied_at": rec.applied_at.isoformat() if rec.applied_at else None,
            "updated_at": rec.updated_at.isoformat() if rec.updated_at else None,
            "history": history_items,
            "job": {
                "id": job.id if job else rec.job_id,
                "slug": job.slug if job else "job",
                "title": job.title if job else "Software Engineer",
                "company": job.company.name if job and job.company else "Tech Company",
                "location": job.location if job else "Remote",
                "apply_url": job.apply_url if job else "",
            },
        }

    @staticmethod
    async def delete_application(
        session: AsyncSession,
        user_id: str,
        application_id: str,
    ) -> Dict[str, Any]:
        query = select(JobApplication).where(
            (JobApplication.id == application_id) & (JobApplication.user_id == user_id)
        )
        res = await session.execute(query)
        rec = res.scalars().first()

        if rec:
            await session.delete(rec)
            await session.commit()

        return {"id": application_id, "deleted": True}
