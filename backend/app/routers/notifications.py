from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.security import get_current_user
from ..database.session import get_session
from ..models.user import User
from ..services.notification_service import NotificationService

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("", status_code=status.HTTP_200_OK)
async def get_notifications_endpoint(
    unread_only: bool = Query(False),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> Dict[str, Any]:
    return await NotificationService.get_user_notifications(
        session=session,
        user_id=current_user.id,
        unread_only=unread_only,
    )


@router.patch("/{id}/read", status_code=status.HTTP_200_OK)
async def mark_notification_as_read_endpoint(
    id: str,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> Dict[str, Any]:
    return await NotificationService.mark_as_read(
        session=session,
        user_id=current_user.id,
        notification_id=id,
    )


@router.post("/read-all", status_code=status.HTTP_200_OK)
async def mark_all_notifications_read_endpoint(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> Dict[str, Any]:
    return await NotificationService.mark_all_as_read(
        session=session,
        user_id=current_user.id,
    )


@router.post("/reminders/trigger", status_code=status.HTTP_201_CREATED)
async def trigger_automated_reminders_endpoint(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> List[Dict[str, Any]]:
    return await NotificationService.generate_automated_reminders(
        session=session,
        user_id=current_user.id,
    )
