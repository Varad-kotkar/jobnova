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
                "resume_url": prof.resume_url if prof else None,
                "skills": prof.skills if prof else [],
                "github_url": prof.github_url if prof else None,
                "linkedin_url": prof.linkedin_url if prof else None,
                "portfolio_url": prof.portfolio_url if prof else None,
                "preferred_roles": prof.preferred_roles if prof else [],
                "preferred_locations": prof.preferred_locations if prof else [],
                "remote_preference": prof.remote_preference if prof else True,
                "salary_expectation": prof.salary_expectation if prof else None,
                "completion_percentage": prof.completion_percentage if prof else 15,
                "onboarding_completed": prof.onboarding_completed if prof else False,
                "availability": prof.availability if prof else None,
                "work_authorization": prof.work_authorization if prof else None,
                "experience_years": prof.experience_years if prof else None,
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
            "resume_url",
            "skills",
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
        ]

        for field in profile_fields:
            if field in update_data:
                setattr(prof, field, update_data[field])

        # Compute completion percentage dynamically (10 fields, each worth 10%)
        filled = 0
        if prof.headline: filled += 1
        if prof.bio: filled += 1
        if prof.location: filled += 1
        if prof.skills and len(prof.skills) > 0: filled += 2  # skills worth double
        if prof.resume_url: filled += 2  # resume worth double
        if prof.github_url or prof.linkedin_url: filled += 1
        if prof.preferred_roles and len(prof.preferred_roles) > 0: filled += 1
        if prof.salary_expectation: filled += 1
        if prof.preferred_locations and len(prof.preferred_locations) > 0: filled += 1

        prof.completion_percentage = min(100, int((filled / 10) * 100))

        await session.commit()
        return await UserService.get_user_profile(session, user_id)
