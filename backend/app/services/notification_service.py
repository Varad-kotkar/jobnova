from __future__ import annotations

from datetime import datetime, timezone
import logging
from typing import Any, Dict, List

from fastapi import HTTPException, status
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, selectinload

from ..models.job import Job
from ..models.job_application import JobApplication
from ..models.notification import Notification

logger = logging.getLogger("backend.app.notification_service")


class NotificationService:
    @staticmethod
    async def create_notification(
        session: AsyncSession,
        user_id: str,
        type: str,
        title: str,
        message: str,
        priority: str = "Medium",
        channel: str = "App",
    ) -> Dict[str, Any]:
        notification = Notification(
            user_id=user_id,
            type=type,
            title=title,
            message=message,
            priority=priority,
            channel=channel,
            is_read=False,
        )
        session.add(notification)
        await session.commit()

        return {
            "id": notification.id,
            "type": notification.type,
            "title": notification.title,
            "message": notification.message,
            "priority": notification.priority,
            "channel": notification.channel,
            "is_read": notification.is_read,
            "created_at": notification.created_at.isoformat() if notification.created_at else None,
        }

    @staticmethod
    async def get_user_notifications(
        session: AsyncSession,
        user_id: str,
        unread_only: bool = False,
    ) -> Dict[str, Any]:
        query = select(Notification).where(Notification.user_id == user_id)
        if unread_only:
            query = query.where(Notification.is_read == False)

        query = query.order_by(Notification.created_at.desc())
        res = await session.execute(query)
        notifications = res.scalars().all()

        unread_count_query = select(func.count(Notification.id)).where(
            (Notification.user_id == user_id) & (Notification.is_read == False)
        )
        unread_res = await session.execute(unread_count_query)
        unread_count = unread_res.scalar_one() or 0

        formatted = [
            {
                "id": n.id,
                "type": n.type,
                "title": n.title,
                "message": n.message,
                "priority": n.priority,
                "channel": n.channel,
                "is_read": n.is_read,
                "created_at": n.created_at.isoformat() if n.created_at else None,
            }
            for n in notifications
        ]

        return {
            "unread_count": unread_count,
            "notifications": formatted,
        }

    @staticmethod
    async def mark_as_read(
        session: AsyncSession,
        user_id: str,
        notification_id: str,
    ) -> Dict[str, Any]:
        query = select(Notification).where(
            (Notification.id == notification_id) & (Notification.user_id == user_id)
        )
        res = await session.execute(query)
        notification = res.scalars().first()

        if not notification:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")

        notification.is_read = True
        notification.read_at = datetime.now(timezone.utc)
        await session.commit()

        return {"id": notification.id, "is_read": True}

    @staticmethod
    async def mark_all_as_read(
        session: AsyncSession,
        user_id: str,
    ) -> Dict[str, Any]:
        await session.execute(
            update(Notification)
            .where((Notification.user_id == user_id) & (Notification.is_read == False))
            .values(is_read=True, read_at=datetime.now(timezone.utc))
        )
        await session.commit()
        return {"status": "success", "message": "All notifications marked as read"}

    @staticmethod
    async def generate_automated_reminders(
        session: AsyncSession,
        user_id: str,
    ) -> List[Dict[str, Any]]:
        # Query candidate applications with job and company details
        query = (
            select(JobApplication)
            .options(selectinload(JobApplication.job).selectinload(Job.company))
            .where(JobApplication.user_id == user_id)
        )
        res = await session.execute(query)
        apps = res.scalars().all()

        created_reminders = []
        now = datetime.now(timezone.utc)

        for app in apps:
            job = app.job
            company_name = job.company.name if job and job.company else "Company"
            job_title = job.title if job else "Software Engineer"

            if app.status == "Applied":
                # Create follow-up reminder
                n = await NotificationService.create_notification(
                    session=session,
                    user_id=user_id,
                    type="application_reminder",
                    title=f"Follow Up: {job_title} at {company_name}",
                    message=f"It's been a few days since applying for {job_title}. Send a polite follow-up email to the recruiter.",
                    priority="Medium",
                    channel="App",
                )
                created_reminders.append(n)

            elif app.status == "Interview":
                # Create interview prep reminder
                n = await NotificationService.create_notification(
                    session=session,
                    user_id=user_id,
                    type="interview_alert",
                    title=f"🗓️ Upcoming Interview: {job_title} ({company_name})",
                    message=f"Prepare for your scheduled interview using JobNova's AI Interview Coach module.",
                    priority="High",
                    channel="App",
                )
                created_reminders.append(n)

        return created_reminders
