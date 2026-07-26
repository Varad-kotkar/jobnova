from typing import Callable, Sequence

from fastapi import Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .security import get_current_user
from ..database.session import get_session
from ..models.recruiter import RecruiterProfile
from ..models.user import User


def require_roles(*permitted_roles: str) -> Callable:
    """Dependency factory enforcing Role-Based Access Control (RBAC)."""

    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        user_role = getattr(current_user, "role", "candidate") or "candidate"
        if user_role == "admin":
            return current_user

        if user_role not in permitted_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: role '{user_role}' does not have permission to access this resource",
            )
        return current_user

    return role_checker


async def require_verified_recruiter(
    current_user: User = Depends(require_roles("recruiter", "admin")),
    session: AsyncSession = Depends(get_session),
) -> User:
    """Enforces that a recruiter account has been reviewed and approved by an admin."""
    user_role = getattr(current_user, "role", "candidate") or "candidate"
    if user_role == "admin":
        return current_user

    stmt = select(RecruiterProfile).where(RecruiterProfile.user_id == current_user.id)
    result = await session.execute(stmt)
    profile = result.scalars().first()

    if not profile or profile.verification_status != "approved":
        status_msg = profile.verification_status if profile else "unregistered"
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Recruiter verification required. Current status: '{status_msg}'. Only approved recruiters may post jobs.",
        )

    return current_user
