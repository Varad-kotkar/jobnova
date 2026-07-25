from __future__ import annotations

import logging
from typing import Any, Dict, Optional, Tuple

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..core.security import create_access_token, hash_password, verify_password
from ..models.user import User
from ..models.user_profile import UserProfile

logger = logging.getLogger("backend.app.auth_service")


class AuthService:
    @staticmethod
    async def register_user(
        session: AsyncSession,
        email: str,
        password: str,
        full_name: str,
    ) -> Tuple[User, str]:
        clean_email = email.strip().lower()
        if not clean_email or "@" not in clean_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Valid email address is required",
            )

        if len(password) < 6:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must be at least 6 characters long",
            )

        # Check existing user
        query = select(User).where(User.email == clean_email)
        result = await session.execute(query)
        if result.scalars().first():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="User with this email already exists",
            )

        new_user = User(
            email=clean_email,
            hashed_password=hash_password(password),
            full_name=full_name.strip() or "Candidate",
        )
        session.add(new_user)
        await session.flush()

        # Create profile
        new_profile = UserProfile(
            user_id=new_user.id,
            headline="Software Engineer",
            skills=["TypeScript", "React", "Python"],
            preferred_roles=["Frontend Engineer", "Full Stack Developer"],
            completion_percentage=40,
        )
        session.add(new_profile)
        await session.commit()

        token = create_access_token({"sub": new_user.id, "email": new_user.email})
        return new_user, token

    @staticmethod
    async def authenticate_user(
        session: AsyncSession,
        email: str,
        password: str,
    ) -> Tuple[User, str]:
        clean_email = email.strip().lower()
        query = select(User).options(selectinload(User.profile)).where(User.email == clean_email)
        result = await session.execute(query)
        user = result.scalars().first()

        if not user or not user.hashed_password or not verify_password(password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is deactivated",
            )

        token = create_access_token({"sub": user.id, "email": user.email})
        return user, token
