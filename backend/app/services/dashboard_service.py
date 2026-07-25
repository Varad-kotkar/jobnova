from __future__ import annotations

import logging
from typing import Any, Dict, List

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..models.job import Job
from ..models.job_application import JobApplication
from ..models.saved_job import SavedJob
from ..models.user import User
from ..services.user_service import UserService

logger = logging.getLogger("backend.app.dashboard_service")


class DashboardService:
    @staticmethod
    async def get_candidate_dashboard_data(
        session: AsyncSession,
        user_id: str,
    ) -> Dict[str, Any]:
        # 1. Fetch user profile data
        user_profile = await UserService.get_user_profile(session, user_id)

        # 2. Fetch all user applications with job and company metadata
        apps_query = (
            select(JobApplication)
            .options(selectinload(JobApplication.job).selectinload(Job.company))
            .where(JobApplication.user_id == user_id)
            .order_by(JobApplication.applied_at.desc())
        )
        apps_res = await session.execute(apps_query)
        applications = apps_res.scalars().all()

        # 3. Funnel aggregation
        funnel = {
            "Applied": 0,
            "Screening": 0,
            "Interview": 0,
            "Offer": 0,
            "Rejected": 0,
            "Withdrawn": 0,
        }
        for app in applications:
            if app.status in funnel:
                funnel[app.status] += 1
            else:
                funnel["Applied"] += 1

        total_applications = len(applications)
        interviews_count = funnel["Interview"] + funnel["Offer"]
        response_rate = round((interviews_count / total_applications * 100), 1) if total_applications > 0 else 0.0

        # 4. Fetch upcoming interviews
        upcoming_interviews = []
        for app in applications:
            if app.status in ("Interview", "Offer") or app.interview_date:
                job = app.job
                upcoming_interviews.append(
                    {
                        "application_id": app.id,
                        "job_id": app.job_id,
                        "title": job.title if job else "Software Engineer",
                        "company": job.company.name if job and job.company else "Tech Company",
                        "status": app.status,
                        "interview_date": app.interview_date.isoformat() if app.interview_date else None,
                        "notes": app.notes,
                    }
                )

        # 5. Fetch saved jobs
        saved_query = (
            select(SavedJob)
            .options(selectinload(SavedJob.job).selectinload(Job.company))
            .where(SavedJob.user_id == user_id)
            .order_by(SavedJob.created_at.desc())
            .limit(5)
        )
        saved_res = await session.execute(saved_query)
        saved_jobs = saved_res.scalars().all()

        saved_jobs_data = []
        for sj in saved_jobs:
            job = sj.job
            if not job:
                continue
            saved_jobs_data.append(
                {
                    "id": job.id,
                    "slug": job.slug,
                    "title": job.title,
                    "company": job.company.name if job.company else "Employer",
                    "location": job.location,
                    "remote": job.remote,
                    "saved_at": sj.created_at.isoformat() if sj.created_at else None,
                }
            )

        # 6. Format recent applications list
        recent_applications = []
        for app in applications[:5]:
            job = app.job
            recent_applications.append(
                {
                    "id": app.id,
                    "job_id": app.job_id,
                    "title": job.title if job else "Software Engineer",
                    "company": job.company.name if job and job.company else "Employer",
                    "status": app.status,
                    "applied_at": app.applied_at.isoformat() if app.applied_at else None,
                }
            )

        # 7. Identify missing profile fields
        prof = user_profile.get("profile", {})
        missing_profile_fields = []
        if not prof.get("headline"): missing_profile_fields.append("Professional Headline")
        if not prof.get("bio"): missing_profile_fields.append("Short Bio")
        if not prof.get("resume_url"): missing_profile_fields.append("Resume Document")
        if not prof.get("skills") or len(prof.get("skills")) < 3: missing_profile_fields.append("Core Tech Skills")
        if not prof.get("linkedin_url"): missing_profile_fields.append("LinkedIn Profile")
        if not prof.get("github_url"): missing_profile_fields.append("GitHub Profile")

        return {
            "metrics": {
                "total_applications": total_applications,
                "active_interviews": funnel["Interview"],
                "offers_received": funnel["Offer"],
                "saved_jobs_count": len(saved_jobs_data),
                "response_rate_percentage": response_rate,
            },
            "funnel": funnel,
            "upcoming_interviews": upcoming_interviews,
            "recent_applications": recent_applications,
            "saved_jobs": saved_jobs_data,
            "profile_completeness": {
                "percentage": prof.get("completion_percentage", 40),
                "missing_fields": missing_profile_fields,
            },
        }
