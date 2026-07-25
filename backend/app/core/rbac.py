from typing import Callable, Sequence

from fastapi import Depends, HTTPException, status

from .security import get_current_user
from ..models.user import User


def require_roles(*permitted_roles: str) -> Callable:
    """Dependency factory enforcing Role-Based Access Control (RBAC)."""

    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        user_role = getattr(current_user, "role", "candidate") or "candidate"
        if "admin" in user_role:
            return current_user

        if user_role not in permitted_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: role '{user_role}' does not have permission to access this resource",
            )
        return current_user

    return role_checker
