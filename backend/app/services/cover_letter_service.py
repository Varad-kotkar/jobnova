from __future__ import annotations

import logging
from typing import Any, Dict, List

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, selectinload

from ..models.job import Job
from ..models.resume import Resume
from ..models.user import User

logger = logging.getLogger("backend.app.cover_letter_service")

VALID_TONES = ["Professional", "Enthusiastic", "Startup", "Executive", "Concise", "Detailed"]


class CoverLetterService:
    @staticmethod
    async def generate_cover_letter(
        session: AsyncSession,
        user_id: str,
        job_id: str,
        tone: str = "Professional",
    ) -> Dict[str, Any]:
        if tone not in VALID_TONES:
            tone = "Professional"

        # 1. Fetch Target Job
        job_query = select(Job).options(joinedload(Job.company)).where(Job.id == job_id)
        job_res = await session.execute(job_query)
        job = job_res.scalars().first()

        if not job:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target job listing not found")

        # 2. Fetch Candidate User and Primary Resume
        user_query = select(User).options(selectinload(User.profile)).where(User.id == user_id)
        user_res = await session.execute(user_query)
        user = user_res.scalars().first()

        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate user not found")

        resume_query = select(Resume).where((Resume.user_id == user_id) & (Resume.is_primary == True))
        res_res = await session.execute(resume_query)
        resume = res_res.scalars().first()

        candidate_name = user.full_name or (user.profile.headline if user.profile else "Candidate")
        company_name = job.company.name if job.company else "your team"
        job_title = job.title

        profile_skills = (user.profile.skills if user.profile else []) or []
        resume_skills = (resume.extracted_skills if resume else []) or []
        candidate_skills = list(dict.fromkeys(profile_skills + resume_skills))
        top_skills_str = ", ".join(candidate_skills[:4]) if candidate_skills else "software engineering and modern web technology"

        # 3. Synthesize Cover Letter Text based on selected Tone
        if tone == "Enthusiastic":
            opening = f"Dear Hiring Team at {company_name},\n\nI was thrilled to see the opening for {job_title}! With my extensive background in {top_skills_str}, I am genuinely excited about the opportunity to contribute to {company_name}'s mission."
            closing = "I would love the opportunity to discuss how my passion and technical drive can help achieve your engineering goals. Thank you for your time and consideration!"
        elif tone == "Startup":
            opening = f"Hi {company_name} Team,\n\nI am writing to express my strong interest in the {job_title} role. As a software developer specializing in {top_skills_str}, I thrive in fast-paced startup environments building scalable products."
            closing = "I'm eager to help move fast, ship high-impact features, and scale {company_name}. Let's get in touch!"
        elif tone == "Executive":
            opening = f"Dear Hiring Leadership,\n\nRe: Application for {job_title} at {company_name}.\n\nThroughout my career in software engineering, I have focused on building resilient systems and leading technical initiatives. My core expertise in {top_skills_str} aligns directly with {company_name}'s requirements."
            closing = "Thank you for reviewing my application. I welcome the opportunity to discuss how my technical leadership can drive measurable results for {company_name}."
        elif tone == "Concise":
            opening = f"Dear {company_name} Hiring Manager,\n\nI am applying for the {job_title} position. My technical background includes hands-on experience in {top_skills_str}."
            closing = "I am confident in my ability to make an immediate contribution to your team and look forward to discussing the role."
        else:
            opening = f"Dear Hiring Manager at {company_name},\n\nI am writing to apply for the position of {job_title}. Having developed a solid technical background in {top_skills_str}, I am confident in my ability to bring value to your engineering team at {company_name}."
            closing = "Thank you for your time and consideration. I welcome the opportunity to speak with you regarding how my technical skills and background align with your current engineering goals."

        body_paragraph = f"In my recent work, I have focused on architecting robust applications, optimizing performance, and delivering clean, maintainable software. The requirements described for {job_title} mirror my technical focus and career direction. I am particularly drawn to {company_name} due to your commitment to engineering excellence."

        full_letter = f"{opening}\n\n{body_paragraph}\n\n{closing}\n\nSincerely,\n{candidate_name}"

        word_count = len(full_letter.split())
        est_read_time = "1 minute" if word_count < 250 else "2 minutes"

        return {
            "job_id": job.id,
            "job_title": job.title,
            "company_name": company_name,
            "cover_letter": full_letter,
            "personalization_score": 92 if len(candidate_skills) >= 3 else 78,
            "highlighted_resume_strengths": candidate_skills[:4],
            "highlighted_job_requirements": (job.skills or [])[:4],
            "tone": tone,
            "estimated_read_time": est_read_time,
        }
