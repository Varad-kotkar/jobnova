from __future__ import annotations

from datetime import datetime, timezone
import logging
import re
from typing import Any, Dict, List

from fastapi import HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, selectinload

from ..models.company import Company
from ..models.job import Job
from ..models.job_application import JobApplication
from ..models.recruiter import RecruiterProfile
from ..models.resume import Resume
from ..models.source import Source
from ..models.user import User
from ..services.ai_match_service import AIMatchService
from ..services.application_service import ApplicationService
from ..services.notification_service import NotificationService

logger = logging.getLogger("backend.app.recruiter_service")


def _generate_slug(company: str, title: str, location: str) -> str:
    raw = f"{company}-{title}-{location}".lower()
    cleaned = re.sub(r"[^\w\s-]", "", raw)
    slug = re.sub(r"[-\s]+", "-", cleaned).strip("-")
    return slug[:100]


class RecruiterService:
    @staticmethod
    async def create_recruiter_job(
        session: AsyncSession,
        user_id: str,
        title: str,
        description: str,
        location: str,
        remote: bool,
        skills: List[str],
        company_name: str,
    ) -> Dict[str, Any]:
        # Get or create company
        comp_query = select(Company).where(Company.name == company_name)
        comp_res = await session.execute(comp_query)
        company = comp_res.scalars().first()

        if not company:
            company = Company(name=company_name)
            session.add(company)
            await session.flush()

        # Get or create source for recruiter postings
        src_query = select(Source).where(Source.name == "recruiter_portal")
        src_res = await session.execute(src_query)
        source = src_res.scalars().first()

        if not source:
            source = Source(name="recruiter_portal")
            session.add(source)
            await session.flush()

        slug = _generate_slug(company_name, title, location)
        apply_url = f"https://jobnova.app/jobs/{slug}"

        new_job = Job(
            source_id=source.id,
            company_id=company.id,
            title=title,
            description=description,
            location=location,
            apply_url=apply_url,
            slug=slug,
            skills=skills,
            remote=remote,
            published_at=datetime.now(timezone.utc),
        )
        session.add(new_job)

        # Ensure user role is recruiter
        user_query = select(User).where(User.id == user_id)
        user_res = await session.execute(user_query)
        user = user_res.scalars().first()
        if user:
            user.role = "recruiter"

        await session.commit()

        from ..core.cache import CacheManager
        await CacheManager.delete_pattern("jobs:list:")

        return {
            "id": new_job.id,
            "slug": new_job.slug,
            "title": new_job.title,
            "company": company_name,
            "location": new_job.location,
            "remote": new_job.remote,
            "skills": new_job.skills,
            "published_at": new_job.published_at.isoformat(),
        }

    @staticmethod
    async def get_recruiter_applications(
        session: AsyncSession,
        user_id: str,
    ) -> List[Dict[str, Any]]:
        # Query applications submitted across active jobs
        query = (
            select(JobApplication)
            .options(
                selectinload(JobApplication.job).selectinload(Job.company),
                selectinload(JobApplication.user).selectinload(User.profile),
            )
            .order_by(JobApplication.applied_at.desc())
        )
        res = await session.execute(query)
        applications = res.scalars().all()

        results = []
        for app in applications:
            job = app.job
            candidate = app.user

            # Fetch candidate primary resume
            resume_query = select(Resume).where((Resume.user_id == candidate.id) & (Resume.is_primary == True))
            res_res = await session.execute(resume_query)
            primary_resume = res_res.scalars().first()

            # Calculate AI Fit Score
            ai_fit = await AIMatchService.calculate_job_match(session, candidate.id, job.id)

            results.append(
                {
                    "application_id": app.id,
                    "candidate_id": candidate.id,
                    "candidate_name": candidate.full_name,
                    "candidate_email": candidate.email,
                    "candidate_headline": candidate.profile.headline if candidate.profile else "Software Candidate",
                    "job_id": job.id,
                    "job_title": job.title,
                    "company_name": job.company.name if job.company else "Company",
                    "status": app.status,
                    "priority": app.priority,
                    "applied_at": app.applied_at.isoformat() if app.applied_at else None,
                    "ai_match_score": ai_fit["match_score"],
                    "ai_recommendation": ai_fit["recommendation"],
                    "matched_skills": ai_fit["matched_skills"],
                    "missing_skills": ai_fit["missing_skills"],
                    "resume": {
                        "id": primary_resume.id if primary_resume else None,
                        "file_name": primary_resume.file_name if primary_resume else None,
                        "version": primary_resume.version if primary_resume else None,
                    },
                }
            )

        return results

    @staticmethod
    async def update_applicant_status(
        session: AsyncSession,
        user_id: str,
        application_id: str,
        new_status: str,
        notes: str = "",
    ) -> Dict[str, Any]:
        app_query = (
            select(JobApplication)
            .options(selectinload(JobApplication.job).selectinload(Job.company))
            .where(JobApplication.id == application_id)
        )
        app_res = await session.execute(app_query)
        app_obj = app_res.scalars().first()

        if not app_obj:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application record not found")

        old_status = app_obj.status
        app_obj.status = new_status

        from ..models.application_status_history import ApplicationStatusHistory
        history_entry = ApplicationStatusHistory(
            application_id=app_obj.id,
            previous_status=old_status,
            new_status=new_status,
            notes=notes,
        )
        session.add(history_entry)

        job = app_obj.job
        company_name = job.company.name if job and job.company else "Employer"
        job_title = job.title if job else "Role"

        await NotificationService.create_notification(
            session=session,
            user_id=app_obj.user_id,
            type="application_reminder",
            title=f"Application Update: {job_title} ({company_name})",
            message=f"Your application status for {job_title} at {company_name} was updated to {new_status}.",
            priority="High" if new_status in ("Interview", "Offer") else "Medium",
            channel="App",
        )

        now_iso = datetime.now(timezone.utc).isoformat()
        await session.commit()

        return {
            "id": app_obj.id,
            "status": app_obj.status,
            "updated_at": now_iso,
        }
