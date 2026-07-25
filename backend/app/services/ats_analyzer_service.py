from __future__ import annotations

import logging
import re
from typing import Any, Dict, List

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from ..models.job import Job
from ..models.resume import Resume
from ..models.user import User

logger = logging.getLogger("backend.app.ats_analyzer_service")


class ATSAnalyzerService:
    @staticmethod
    async def analyze_resume_for_job(
        session: AsyncSession,
        user_id: str,
        job_id: str,
    ) -> Dict[str, Any]:
        # 1. Fetch Target Job
        job_query = select(Job).options(joinedload(Job.company)).where(Job.id == job_id)
        job_res = await session.execute(job_query)
        job = job_res.scalars().first()

        if not job:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target job listing not found")

        # 2. Fetch Primary Resume
        resume_query = select(Resume).where((Resume.user_id == user_id) & (Resume.is_primary == True))
        res_res = await session.execute(resume_query)
        resume = res_res.scalars().first()

        if not resume:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No primary resume found. Please upload a resume before running ATS analysis.",
            )

        # 3. Analyze Keyword Match
        resume_text_lower = (resume.parsed_text or "").lower()
        extracted_skills = [s.lower() for s in (resume.extracted_skills or [])]

        job_skills = [s.lower() for s in (job.skills or [])]
        if not job_skills and job.description:
            for tech in ["python", "react", "typescript", "fastapi", "django", "postgresql", "docker", "aws", "kubernetes", "next.js", "graphql", "redis", "pytorch"]:
                if tech in job.description.lower():
                    job_skills.append(tech)

        job_skills = list(dict.fromkeys(job_skills))

        matched_keywords = []
        missing_keywords = []

        for skill in job_skills:
            pattern = r"\b" + re.escape(skill) + r"\b"
            if skill in extracted_skills or re.search(pattern, resume_text_lower):
                matched_keywords.append(skill.title())
            else:
                missing_keywords.append(skill.title())

        keyword_match_pct = (
            round((len(matched_keywords) / len(job_skills)) * 100, 1) if job_skills else 80.0
        )

        # 4. Check Section Completeness
        sections_missing = []
        strengths = []
        improvements = []
        formatting_warnings = []

        contact_info = resume.contact_info or {}
        if contact_info.get("email"):
            strengths.append("Contact info contains valid candidate email address")
        else:
            sections_missing.append("Contact Info (Email)")

        if resume.extracted_skills and len(resume.extracted_skills) >= 3:
            strengths.append(f"Contains structured skills section ({len(resume.extracted_skills)} tech skills detected)")
        else:
            improvements.append("Expand skills section to include at least 5 core technical competencies")

        if not re.search(r"\b(project|portfolio|github)\b", resume_text_lower):
            sections_missing.append("Projects & Portfolio Section")
            improvements.append("Add a dedicated Projects section linking to GitHub repositories or live apps")

        if not re.search(r"\b(education|university|bachelor|master|degree|b\.s|m\.s)\b", resume_text_lower):
            sections_missing.append("Education Section")

        # Check for quantitative impact / action verbs
        if not re.search(r"\b(\d+%|\$\d+|\d+x|improved|increased|reduced|built|scaled|architected)\b", resume_text_lower):
            improvements.append("Add quantitative impact metrics (e.g., 'Improved API response time by 40%')")

        # Standard ATS formatting guidelines
        formatting_warnings.append("Ensure your resume uses standard bullet points and avoids complex multi-column tables or embedded image graphics for optimal ATS parsing.")

        # 5. Compute Final ATS Score
        kw_score = min(40, (len(matched_keywords) / max(1, len(job_skills))) * 40)
        completeness_score = max(10, 30 - (len(sections_missing) * 7))
        relevance_score = 20 if keyword_match_pct >= 60 else 10
        formatting_score = 10

        final_ats_score = int(min(100, max(25, kw_score + completeness_score + relevance_score + formatting_score)))

        recommended_changes = [
            f"Add missing keywords: {', '.join(missing_keywords[:4])}" if missing_keywords else "Your skill keywords align strongly with job requirements.",
            "Tailor your professional summary to highlight matching core skills.",
            "Ensure education and work experience dates follow standard format (MM/YYYY).",
        ]

        return {
            "job_id": job.id,
            "job_title": job.title,
            "company_name": job.company.name if job.company else "Employer",
            "resume_id": resume.id,
            "resume_version": resume.version,
            "ats_score": final_ats_score,
            "keyword_match_percentage": keyword_match_pct,
            "matched_keywords": matched_keywords,
            "missing_keywords": missing_keywords,
            "resume_strengths": strengths,
            "resume_improvements": improvements,
            "formatting_warnings": formatting_warnings,
            "sections_missing": sections_missing,
            "recommended_changes": recommended_changes,
            "score_breakdown": {
                "keyword_coverage": int(kw_score),
                "section_completeness": int(completeness_score),
                "relevance": int(relevance_score),
                "formatting_structure": int(formatting_score),
            },
        }
