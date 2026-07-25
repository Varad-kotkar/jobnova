import uuid
from datetime import datetime, timezone
import pytest

from app.models.company import Company
from app.models.source import Source
from app.models.job import Job
from app.routers.auth import register, RegisterRequest
from app.services.auth_service import AuthService
from app.routers.applications import create_application_endpoint, CreateApplicationPayload
from app.routers.notifications import (
    get_notifications_endpoint,
    mark_notification_as_read_endpoint,
    mark_all_notifications_read_endpoint,
    trigger_automated_reminders_endpoint,
)
from app.services.notification_service import NotificationService


@pytest.mark.anyio
async def test_notification_creation_and_unread_management(async_session):
    unique_suffix = str(uuid.uuid4())[:8]

    # Register candidate user
    reg_req = RegisterRequest(
        email=f"candidate-{unique_suffix}@example.com",
        password="password123",
        full_name=f"Candidate {unique_suffix}",
    )
    await register(reg_req, session=async_session)
    user, _ = await AuthService.authenticate_user(async_session, reg_req.email, "password123")

    # 1. Create Notification directly
    n1 = await NotificationService.create_notification(
        session=async_session,
        user_id=user.id,
        type="ats_update",
        title="ATS Score Updated",
        message="Your primary resume ATS score improved to 88%",
        priority="High",
        channel="App",
    )
    assert n1["is_read"] is False

    # 2. Get Notifications List
    res1 = await get_notifications_endpoint(unread_only=False, current_user=user, session=async_session)
    assert res1["unread_count"] == 1
    assert len(res1["notifications"]) == 1

    # 3. Mark Single as Read
    mark_res = await mark_notification_as_read_endpoint(n1["id"], current_user=user, session=async_session)
    assert mark_res["is_read"] is True

    res2 = await get_notifications_endpoint(unread_only=False, current_user=user, session=async_session)
    assert res2["unread_count"] == 0

    # 4. Trigger Automated Reminders for Application
    company = Company(name=f"Google-{unique_suffix}")
    source = Source(name=f"test_source-{unique_suffix}")
    async_session.add_all([company, source])
    await async_session.flush()

    job1 = Job(
        source_id=source.id,
        company_id=company.id,
        title="Senior Software Engineer",
        description="Core infrastructure team.",
        location="Mountain View, CA",
        apply_url=f"https://google.example/apply/{unique_suffix}",
        slug=f"google-infra-{unique_suffix}",
        skills=["c++", "python"],
        remote=False,
        published_at=datetime.now(timezone.utc),
    )
    async_session.add(job1)
    await async_session.commit()

    await create_application_endpoint(
        CreateApplicationPayload(job_id=job1.id, status="Applied"),
        current_user=user,
        session=async_session,
    )

    reminders = await trigger_automated_reminders_endpoint(current_user=user, session=async_session)
    assert len(reminders) >= 1

    res3 = await get_notifications_endpoint(unread_only=True, current_user=user, session=async_session)
    assert res3["unread_count"] >= 1

    # 5. Mark All as Read
    await mark_all_notifications_read_endpoint(current_user=user, session=async_session)
    res4 = await get_notifications_endpoint(unread_only=False, current_user=user, session=async_session)
    assert res4["unread_count"] == 0
