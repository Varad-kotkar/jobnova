from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, selectinload

from ..models.job import Job
from ..models.saved_job import SavedJob

logger = logging.getLogger("backend.app.saved_job_service")


class SavedJobService:
    @staticmethod
    async def save_job(
        session: AsyncSession,
        user_id: str,
        job_id: str,
        notes: Optional[str] = None,
    ) -> Dict[str, Any]:
        # Check job exists
        job_query = select(Job).where(Job.id == job_id)
        job_res = await session.execute(job_query)
        job = job_res.scalars().first()

        if not job:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job listing not found")

        # Check existing save
        check_query = select(SavedJob).where((SavedJob.user_id == user_id) & (SavedJob.job_id == job_id))
        res = await session.execute(check_query)
        existing = res.scalars().first()

        if existing:
            if notes:
                existing.notes = notes
                await session.commit()
            return {"id": existing.id, "user_id": user_id, "job_id": job_id, "saved": True}

        saved_item = SavedJob(user_id=user_id, job_id=job_id, notes=notes)
        session.add(saved_item)
        await session.commit()

        return {"id": saved_item.id, "user_id": user_id, "job_id": job_id, "saved": True}

    @staticmethod
    async def remove_saved_job(
        session: AsyncSession,
        user_id: str,
        job_id: str,
    ) -> Dict[str, Any]:
        query = select(SavedJob).where((SavedJob.user_id == user_id) & (SavedJob.job_id == job_id))
        res = await session.execute(query)
        existing = res.scalars().first()

        if existing:
            await session.delete(existing)
            await session.commit()

        return {"job_id": job_id, "saved": False}

    @staticmethod
    async def get_saved_job_ids(
        session: AsyncSession,
        user_id: str,
    ) -> List[str]:
        query = select(SavedJob.job_id).where(SavedJob.user_id == user_id)
        res = await session.execute(query)
        return [job_id for (job_id,) in res.all()]

    @staticmethod
    async def get_saved_jobs(
        session: AsyncSession,
        user_id: str,
    ) -> List[Dict[str, Any]]:
        query = (
            select(SavedJob)
            .options(selectinload(SavedJob.job).selectinload(Job.company))
            .where(SavedJob.user_id == user_id)
            .order_by(SavedJob.created_at.desc())
        )
        res = await session.execute(query)
        saved_items = res.scalars().all()

        results = []
        for item in saved_items:
            job = item.job
            if not job:
                continue
            results.append(
                {
                    "saved_id": item.id,
                    "notes": item.notes,
                    "created_at": item.created_at.isoformat() if item.created_at else None,
                    "job": {
                        "id": job.id,
                        "slug": job.slug,
                        "title": job.title,
                        "description": job.description,
                        "location": job.location,
                        "company": job.company.name if job.company else "Tech Employer",
                        "apply_url": job.apply_url,
                        "skills": job.skills or [],
                        "remote": job.remote,
                        "published_at": job.published_at.isoformat() if job.published_at else None,
                    },
                }
            )

        return results
