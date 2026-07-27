from __future__ import annotations

import logging
from typing import Any, Dict, Optional

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..models.user import User
from ..models.user_profile import UserProfile

logger = logging.getLogger("backend.app.user_service")


def _calculate_completion(prof: UserProfile) -> int:
    """Calculate profile completion percentage based on filled fields.
    Each field contributes a weight. Total weights = 20, percentage = (filled_weight / 20) * 100.
    """
    score = 0

    # Core identity (weight: 6)
    if prof.headline:
        score += 2
    if prof.location:
        score += 2
    if prof.experience_years is not None:
        score += 2

    # Skills & roles (weight: 4)
    if prof.skills and len(prof.skills) >= 1:
        score += 2
    if prof.preferred_roles and len(prof.preferred_roles) >= 1:
        score += 2

    # Education & career (weight: 3)
    if prof.education and len(prof.education) >= 1:
        score += 2
    if prof.career_goal:
        score += 1

    # Work preferences (weight: 3)
    if prof.salary_expectation:
        score += 1
    if prof.availability:
        score += 1
    if prof.work_authorization:
        score += 1

    # Links & resume (weight: 4)
    if prof.resume_url:
        score += 2
    if prof.github_url or prof.linkedin_url:
        score += 1
    if prof.portfolio_url:
        score += 1

    return min(100, int((score / 20) * 100))


class UserService:
    @staticmethod
    async def get_user_profile(
        session: AsyncSession,
        user_id: str,
    ) -> Dict[str, Any]:
        query = select(User).options(selectinload(User.profile)).where(User.id == user_id)
        result = await session.execute(query)
        user = result.scalars().first()

        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        prof = user.profile
        return {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "avatar_url": user.avatar_url,
            "role": user.role,
            "is_verified": user.is_verified,
            "profile": {
                "headline": prof.headline if prof else None,
                "bio": prof.bio if prof else None,
                "location": prof.location if prof else None,
                "phone": prof.phone if prof else None,
                "resume_url": prof.resume_url if prof else None,
                "profile_photo_url": prof.profile_photo_url if prof else None,
                "skills": prof.skills if prof else [],
                "education": prof.education if prof else [],
                "career_goal": prof.career_goal if prof else None,
                "github_url": prof.github_url if prof else None,
                "linkedin_url": prof.linkedin_url if prof else None,
                "portfolio_url": prof.portfolio_url if prof else None,
                "preferred_roles": prof.preferred_roles if prof else [],
                "preferred_locations": prof.preferred_locations if prof else [],
                "remote_preference": prof.remote_preference if prof else True,
                "salary_expectation": prof.salary_expectation if prof else None,
                "completion_percentage": prof.completion_percentage if prof else 10,
                "onboarding_completed": prof.onboarding_completed if prof else False,
                "availability": prof.availability if prof else None,
                "work_authorization": prof.work_authorization if prof else None,
                "experience_years": prof.experience_years if prof else None,
                "saved_companies": prof.saved_companies if prof else [],
                "recently_viewed_jobs": prof.recently_viewed_jobs if prof else [],
                "weekly_summary_enabled": prof.weekly_summary_enabled if prof else True,
            },
        }

    @staticmethod
    async def update_user_profile(
        session: AsyncSession,
        user_id: str,
        update_data: Dict[str, Any],
    ) -> Dict[str, Any]:
        query = select(User).options(selectinload(User.profile)).where(User.id == user_id)
        result = await session.execute(query)
        user = result.scalars().first()

        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        if "full_name" in update_data and update_data["full_name"]:
            user.full_name = update_data["full_name"].strip()

        if "avatar_url" in update_data:
            user.avatar_url = update_data["avatar_url"]

        prof = user.profile
        if not prof:
            prof = UserProfile(user_id=user.id)
            session.add(prof)

        profile_fields = [
            "headline",
            "bio",
            "location",
            "phone",
            "resume_url",
            "profile_photo_url",
            "skills",
            "education",
            "career_goal",
            "github_url",
            "linkedin_url",
            "portfolio_url",
            "preferred_roles",
            "preferred_locations",
            "remote_preference",
            "salary_expectation",
            "onboarding_completed",
            "availability",
            "work_authorization",
            "experience_years",
            "saved_companies",
            "recently_viewed_jobs",
            "weekly_summary_enabled",
        ]

        for field in profile_fields:
            if field in update_data:
                setattr(prof, field, update_data[field])

        # Auto-calculate completion percentage from actual field data
        prof.completion_percentage = _calculate_completion(prof)

        # Allow explicit override from onboarding completion
        if update_data.get("completion_percentage") is not None:
            explicit = update_data["completion_percentage"]
            if explicit > prof.completion_percentage:
                prof.completion_percentage = explicit

        await session.commit()
        return await UserService.get_user_profile(session, user_id)
