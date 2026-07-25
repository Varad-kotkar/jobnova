from __future__ import annotations

import logging
import re
from typing import Any, Dict, List, Optional

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, selectinload

from ..models.job import Job
from ..models.resume import Resume
from ..models.user import User
from ..models.user_profile import UserProfile

logger = logging.getLogger("backend.app.ai_match_service")


class AIMatchService:
    @staticmethod
    async def calculate_job_match(
        session: AsyncSession,
        user_id: str,
        job_id: str,
    ) -> Dict[str, Any]:
        # 1. Fetch Job
        job_query = select(Job).options(joinedload(Job.company)).where(Job.id == job_id)
        job_res = await session.execute(job_query)
        job = job_res.scalars().first()

        if not job:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job listing not found")

        # 2. Fetch Candidate User, UserProfile, and Primary Resume
        user_query = select(User).options(selectinload(User.profile)).where(User.id == user_id)
        user_res = await session.execute(user_query)
        user = user_res.scalars().first()

        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate user not found")

        resume_query = select(Resume).where((Resume.user_id == user_id) & (Resume.is_primary == True))
        res_res = await session.execute(resume_query)
        primary_resume = res_res.scalars().first()

        # Collect candidate skills & preferred roles
        profile_skills = (user.profile.skills if user.profile else []) or []
        resume_skills = (primary_resume.extracted_skills if primary_resume else []) or []
        candidate_skills = list(dict.fromkeys([s.lower() for s in (profile_skills + resume_skills)]))

        job_skills = [s.lower() for s in (job.skills or [])]
        if not job_skills and job.description:
            # Fallback skill extraction from description
            desc_lower = job.description.lower()
            for tech in ["python", "react", "typescript", "fastapi", "django", "postgresql", "docker", "aws", "kubernetes", "next.js", "pytorch"]:
                if tech in desc_lower:
                    job_skills.append(tech)

        # 3. Calculate Overlap Metrics
        matched_skills_raw = [s for s in job_skills if s in candidate_skills]
        missing_skills_raw = [s for s in job_skills if s not in candidate_skills]

        # Skill Overlap Score (50%)
        if job_skills:
            skill_score = (len(matched_skills_raw) / len(job_skills)) * 50
        else:
            skill_score = 35.0  # Default baseline if job has no explicit skills listed

        # Role & Title Alignment (20%)
        role_score = 10.0
        candidate_roles = [r.lower() for r in (user.profile.preferred_roles if user.profile else []) or []]
        job_title_lower = job.title.lower()

        if any(role in job_title_lower for role in candidate_roles) or (user.profile and user.profile.headline and any(part in job_title_lower for part in user.profile.headline.lower().split())):
            role_score = 20.0

        # Location & Remote Match (15%)
        location_score = 10.0
        if job.remote and (user.profile and user.profile.remote_preference):
            location_score = 15.0
        elif user.profile and user.profile.location and user.profile.location.lower() in (job.location or "").lower():
            location_score = 15.0

        # Seniority Match (15%)
        seniority_score = 15.0

        total_match_score = int(min(100, max(15, skill_score + role_score + location_score + seniority_score)))

        # Format Recommendation Label
        if total_match_score >= 80:
            recommendation = "Strong Match"
        elif total_match_score >= 55:
            recommendation = "Moderate Match"
        else:
            recommendation = "Low Match"

        # Format Reasoning Bullet Points
        reasoning = []
        if len(matched_skills_raw) > 0:
            reasoning.append(f"Matches {len(matched_skills_raw)} required tech skills: {', '.join([s.title() for s in matched_skills_raw[:4]])}")
        if job.remote:
            reasoning.append("Job matches candidate remote work preference")
        if role_score >= 15:
            reasoning.append("Job title aligns with candidate preferred engineering roles")

        if not reasoning:
            reasoning.append("Partial skill and domain alignment detected")

        # Format Display Capitalized Skills
        display_matched = [s.title() for s in matched_skills_raw]
        display_missing = [s.title() for s in missing_skills_raw]

        return {
            "job_id": job.id,
            "job_title": job.title,
            "company_name": job.company.name if job.company else "Employer",
            "match_score": total_match_score,
            "recommendation": recommendation,
            "matched_skills": display_matched,
            "missing_skills": display_missing,
            "reasoning": reasoning,
            "suggested_learning": display_missing[:3],
            "estimated_ats_score": min(95, total_match_score + 5),
            "recommended_resume_version": primary_resume.version if primary_resume else 1,
        }

    @staticmethod
    async def get_top_recommended_jobs(
        session: AsyncSession,
        user_id: str,
        limit: int = 10,
    ) -> List[Dict[str, Any]]:
        # Query active jobs
        query = select(Job).options(joinedload(Job.company)).order_by(Job.published_at.desc()).limit(30)
        res = await session.execute(query)
        jobs = res.scalars().all()

        recommended = []
        for job in jobs:
            match_res = await AIMatchService.calculate_job_match(session, user_id, job.id)
            recommended.append(
                {
                    "id": job.id,
                    "slug": job.slug,
                    "title": job.title,
                    "company": job.company.name if job.company else "Employer",
                    "location": job.location,
                    "remote": job.remote,
                    "match_score": match_res["match_score"],
                    "recommendation": match_res["recommendation"],
                    "matched_skills": match_res["matched_skills"],
                    "missing_skills": match_res["missing_skills"],
                }
            )

        # Sort by match score descending
        recommended.sort(key=lambda x: x["match_score"], reverse=True)
        return recommended[:limit]
