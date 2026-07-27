from __future__ import annotations

import logging
import os
import uuid
from typing import Any, Dict, List, Optional

from fastapi import HTTPException, status
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.resume import Resume
from ..models.user_profile import UserProfile
from ..services.resume_parser import ResumeParser
from ..services.user_service import UserService

logger = logging.getLogger("backend.app.resume_service")

UPLOAD_DIR = os.path.join(os.getcwd(), "uploads", "resumes")


class ResumeService:
    @staticmethod
    async def upload_and_parse_resume(
        session: AsyncSession,
        user_id: str,
        file_bytes: bytes,
        file_name: str,
        file_type: str,
    ) -> Dict[str, Any]:
        if not file_bytes or len(file_bytes) == 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty resume file uploaded")

        os.makedirs(UPLOAD_DIR, exist_ok=True)
        unique_file_id = str(uuid.uuid4())[:8]
        safe_file_name = f"{user_id[:8]}_{unique_file_id}_{file_name}"
        file_path = os.path.join(UPLOAD_DIR, safe_file_name)

        with open(file_path, "wb") as f:
            f.write(file_bytes)

        # Parse text & skills
        parsed_data = ResumeParser.parse(file_bytes, file_name, file_type)

        # Determine version number
        version_query = select(func.count(Resume.id)).where(Resume.user_id == user_id)
        version_res = await session.execute(version_query)
        existing_count = version_res.scalar_one() or 0
        new_version = existing_count + 1

        # Mark existing resumes as non-primary
        await session.execute(
            update(Resume).where(Resume.user_id == user_id).values(is_primary=False)
        )

        new_resume = Resume(
            user_id=user_id,
            file_name=file_name,
            file_path=file_path,
            file_type=file_type,
            file_size=len(file_bytes),
            parsed_text=parsed_data["parsed_text"],
            extracted_skills=parsed_data["skills"],
            extracted_experience=parsed_data["experience"],
            extracted_education=parsed_data["education"],
            contact_info=parsed_data["contact_info"],
            is_primary=True,
            version=new_version,
        )
        session.add(new_resume)

        # Update candidate UserProfile skills and resume URL
        profile_query = select(UserProfile).where(UserProfile.user_id == user_id)
        prof_res = await session.execute(profile_query)
        prof = prof_res.scalars().first()

        if prof:
            existing_skills = prof.skills or []
            combined_skills = list(dict.fromkeys(existing_skills + parsed_data["skills"]))
            prof.skills = combined_skills
            prof.resume_url = f"/uploads/resumes/{safe_file_name}"

            contact = parsed_data.get("contact_info", {})
            if contact.get("phone") and not prof.phone:
                prof.phone = contact["phone"]
            if contact.get("github") and not prof.github_url:
                prof.github_url = contact["github"]
            if contact.get("linkedin") and not prof.linkedin_url:
                prof.linkedin_url = contact["linkedin"]
            if parsed_data.get("education") and not prof.education:
                prof.education = parsed_data["education"]
            if parsed_data.get("experience_years") and prof.experience_years is None:
                prof.experience_years = parsed_data["experience_years"]
            if parsed_data.get("suggested_headline") and not prof.headline:
                prof.headline = parsed_data["suggested_headline"]

            from ..services.user_service import _calculate_completion
            prof.completion_percentage = _calculate_completion(prof)

        await session.commit()

        from ..core.cache import CacheManager
        await CacheManager.delete_pattern(f"match:{user_id}")
        await CacheManager.delete_pattern(f"ats:{user_id}")

        return {
            "id": new_resume.id,
            "file_name": new_resume.file_name,
            "file_type": new_resume.file_type,
            "file_size": new_resume.file_size,
            "version": new_resume.version,
            "extracted_skills": new_resume.extracted_skills,
            "contact_info": new_resume.contact_info,
            "education": new_resume.extracted_education,
            "parsed_fields": {
                "headline": prof.headline if prof else None,
                "phone": prof.phone if prof else None,
                "skills": prof.skills if prof else [],
                "github_url": prof.github_url if prof else None,
                "linkedin_url": prof.linkedin_url if prof else None,
            },
            "created_at": new_resume.created_at.isoformat() if new_resume.created_at else None,
        }

    @staticmethod
    async def get_user_resumes(
        session: AsyncSession,
        user_id: str,
    ) -> List[Dict[str, Any]]:
        query = select(Resume).where(Resume.user_id == user_id).order_by(Resume.version.desc())
        res = await session.execute(query)
        resumes = res.scalars().all()

        return [
            {
                "id": r.id,
                "file_name": r.file_name,
                "file_type": r.file_type,
                "file_size": r.file_size,
                "version": r.version,
                "is_primary": r.is_primary,
                "extracted_skills": r.extracted_skills,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in resumes
        ]

    @staticmethod
    async def get_primary_resume(
        session: AsyncSession,
        user_id: str,
    ) -> Optional[Dict[str, Any]]:
        query = select(Resume).where((Resume.user_id == user_id) & (Resume.is_primary == True))
        res = await session.execute(query)
        primary = res.scalars().first()

        if not primary:
            return None

        return {
            "id": primary.id,
            "file_name": primary.file_name,
            "file_type": primary.file_type,
            "file_size": primary.file_size,
            "version": primary.version,
            "extracted_skills": primary.extracted_skills,
            "contact_info": primary.contact_info,
            "education": primary.extracted_education,
            "experience": primary.extracted_experience,
            "created_at": primary.created_at.isoformat() if primary.created_at else None,
        }
