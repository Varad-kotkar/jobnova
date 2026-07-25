from __future__ import annotations

import logging
from typing import Any, Dict, List

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..models.job_application import JobApplication
from ..models.resume import Resume
from ..models.saved_job import SavedJob
from ..models.user import User
from ..models.user_profile import UserProfile

logger = logging.getLogger("backend.app.career_coach_service")

HIGH_DEMAND_SKILLS = ["Python", "React", "TypeScript", "FastAPI", "PostgreSQL", "Docker", "AWS", "Kubernetes", "Next.js", "Redis", "GraphQL", "PyTorch"]


class CareerCoachService:
    @staticmethod
    async def generate_career_roadmap(
        session: AsyncSession,
        user_id: str,
    ) -> Dict[str, Any]:
        # 1. Fetch Candidate User, Profile, Resume & Applications
        user_query = select(User).options(selectinload(User.profile)).where(User.id == user_id)
        user_res = await session.execute(user_query)
        user = user_res.scalars().first()

        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate user not found")

        resume_query = select(Resume).where((Resume.user_id == user_id) & (Resume.is_primary == True))
        res_res = await session.execute(resume_query)
        primary_resume = res_res.scalars().first()

        apps_query = select(JobApplication).where(JobApplication.user_id == user_id)
        apps_res = await session.execute(apps_query)
        applications = apps_res.scalars().all()

        # Collect Candidate Skills
        profile_skills = (user.profile.skills if user.profile else []) or []
        resume_skills = (primary_resume.extracted_skills if primary_resume else []) or []
        candidate_skills = list(dict.fromkeys(profile_skills + resume_skills))
        candidate_skills_lower = [s.lower() for s in candidate_skills]

        # Determine Career Stage
        if len(candidate_skills) >= 8 or len(applications) >= 10:
            career_stage = "Mid-Level Engineer"
            min_salary = "$110,000"
            max_salary = "$160,000"
        elif len(candidate_skills) >= 4 or len(applications) >= 3:
            career_stage = "Junior Engineer"
            min_salary = "$85,000"
            max_salary = "$120,000"
        else:
            career_stage = "Entry-Level Candidate"
            min_salary = "$70,000"
            max_salary = "$95,000"

        # Identify Skill Gaps vs Strengths
        strengths = candidate_skills[:6] if candidate_skills else ["Software Engineering Fundamentals", "Web Development"]
        skill_gaps = [s for s in HIGH_DEMAND_SKILLS if s.lower() not in candidate_skills_lower][:4]

        # 30-60-90 Day Actionable Roadmap
        plan_30_day = [
            f"Master {skill_gaps[0]} and build a dedicated open-source repository" if skill_gaps else "Optimize resume for target engineering roles",
            "Upload primary resume and run ATS analysis against 5 target listings",
            "Send at least 8 tailored job applications with custom AI cover letters",
        ]

        plan_60_day = [
            f"Incorporate {skill_gaps[1]} into a full-stack production application" if len(skill_gaps) > 1 else "Complete 15 mock coding & system design challenges",
            "Participate in 5 active candidate interviews and track status timelines",
            "Refine LinkedIn and GitHub portfolio projects for recruiter visibility",
        ]

        plan_90_day = [
            "Evaluate job offers and negotiate competitive compensation packages",
            "Finalize onboarding preparation for target role trajectory",
            "Establish 12-month technical growth goals in new position",
        ]

        recommended_projects = [
            {
                "title": f"High-Throughput {skill_gaps[0] if skill_gaps else 'FastAPI'} Service",
                "description": "Build an asynchronous microservice featuring Redis caching and Docker containerization.",
            },
            {
                "title": "Full-Stack Analytics Dashboard",
                "description": "Deploy a Next.js frontend with PostgreSQL backend and real-time visualization widgets.",
            },
        ]

        recommended_job_roles = [
            "Full Stack Software Engineer",
            "Backend Systems Developer",
            "Frontend Engineer",
            "AI / Cloud Solutions Engineer",
        ]

        confidence_score = min(98, max(45, (len(candidate_skills) * 6) + (len(applications) * 4) + (25 if primary_resume else 0)))

        return {
            "career_stage": career_stage,
            "career_confidence_score": confidence_score,
            "current_strengths": strengths,
            "skill_gaps": skill_gaps,
            "recommended_skills": skill_gaps[:3],
            "learning_resources": [f"Learn {s} Official Documentation & Practice Projects" for s in skill_gaps[:3]],
            "recommended_projects": recommended_projects,
            "certifications": ["AWS Certified Developer Associate", "Docker Certified Associate"],
            "salary_projection": {
                "min": min_salary,
                "max": max_salary,
                "currency": "USD",
            },
            "plan_30_day": plan_30_day,
            "plan_60_day": plan_60_day,
            "plan_90_day": plan_90_day,
            "recommended_job_roles": recommended_job_roles,
        }
