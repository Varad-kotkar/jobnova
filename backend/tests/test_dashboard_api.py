import uuid
from datetime import datetime, timezone
import pytest

from app.models.company import Company
from app.models.source import Source
from app.models.job import Job
from app.routers.auth import register, RegisterRequest
from app.services.auth_service import AuthService
from app.routers.applications import create_application_endpoint, update_application_status_endpoint, CreateApplicationPayload, UpdateStatusPayload
from app.routers.saved_jobs import save_job_endpoint
from app.routers.dashboard import get_dashboard_stats


@pytest.mark.anyio
async def test_dashboard_funnel_and_analytics(async_session):
    unique_suffix = str(uuid.uuid4())[:8]

    # Register user
    reg_req = RegisterRequest(
        email=f"candidate-{unique_suffix}@example.com",
        password="password123",
        full_name=f"Candidate {unique_suffix}",
    )
    await register(reg_req, session=async_session)
    user, _ = await AuthService.authenticate_user(async_session, reg_req.email, "password123")

    # Create job & company
    company = Company(name=f"OpenAI-{unique_suffix}")
    source = Source(name=f"test_source-{unique_suffix}")
    async_session.add_all([company, source])
    await async_session.flush()

    job1 = Job(
        source_id=source.id,
        company_id=company.id,
        title="AI Infrastructure Engineer",
        description="Scaling PyTorch clusters",
        location="San Francisco, CA",
        apply_url=f"https://openai.example/apply/{unique_suffix}",
        slug=f"openai-infra-{unique_suffix}",
        skills=["python", "pytorch"],
        remote=True,
        published_at=datetime.now(timezone.utc),
    )
    async_session.add(job1)
    await async_session.commit()

    # 1. Save Job
    await save_job_endpoint(job1.id, payload=None, current_user=user, session=async_session)

    # 2. Create Application & Update to Interview
    app_res = await create_application_endpoint(
        CreateApplicationPayload(job_id=job1.id, status="Applied"),
        current_user=user,
        session=async_session,
    )
    await update_application_status_endpoint(
        app_res["id"],
        payload=UpdateStatusPayload(status="Interview", notes="Interview on Monday"),
        current_user=user,
        session=async_session,
    )

    # 3. Get Dashboard Stats
    stats = await get_dashboard_stats(current_user=user, session=async_session)
    assert stats["metrics"]["total_applications"] == 1
    assert stats["metrics"]["active_interviews"] == 1
    assert stats["metrics"]["saved_jobs_count"] == 1
    assert stats["metrics"]["response_rate_percentage"] == 100.0
    assert stats["funnel"]["Interview"] == 1
    assert len(stats["upcoming_interviews"]) == 1
    assert len(stats["saved_jobs"]) == 1
