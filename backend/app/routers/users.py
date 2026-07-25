from typing import Any, Dict

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.security import get_current_user
from ..database.session import get_session
from ..models.user import User
from ..services.user_service import UserService

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/profile", status_code=status.HTTP_200_OK)
async def get_profile(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> Dict[str, Any]:
    return await UserService.get_user_profile(session, current_user.id)


@router.put("/profile", status_code=status.HTTP_200_OK)
async def update_profile(
    payload: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> Dict[str, Any]:
    return await UserService.update_user_profile(session, current_user.id, payload)
