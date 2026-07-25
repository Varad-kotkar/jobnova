import uuid
from datetime import datetime, timezone
import pytest
from fastapi import HTTPException

from app.models.company import Company
from app.models.source import Source
from app.models.job import Job
from app.routers.auth import register, RegisterRequest
from app.services.auth_service import AuthService
from app.routers.applications import (
    create_application_endpoint,
    list_applications_endpoint,
    get_application_endpoint,
    update_application_status_endpoint,
    CreateApplicationPayload,
    UpdateStatusPayload,
)


@pytest.mark.anyio
async def test_application_tracking_and_history(async_session):
    unique_suffix = str(uuid.uuid4())[:8]

    # Register candidate user
    reg_req = RegisterRequest(
        email=f"candidate-{unique_suffix}@example.com",
        password="password123",
        full_name=f"Candidate {unique_suffix}",
    )
    await register(reg_req, session=async_session)
    user, _ = await AuthService.authenticate_user(async_session, reg_req.email, "password123")

    # Create company & job
    company = Company(name=f"Vercel-{unique_suffix}")
    source = Source(name=f"test_source-{unique_suffix}")
    async_session.add_all([company, source])
    await async_session.flush()

    job1 = Job(
        source_id=source.id,
        company_id=company.id,
        title="Staff Frontend Architect",
        description="Next.js core engineering",
        location="Remote",
        apply_url=f"https://vercel.example/apply/{unique_suffix}",
        slug=f"vercel-frontend-{unique_suffix}",
        skills=["next.js", "typescript"],
        remote=True,
        published_at=datetime.now(timezone.utc),
    )
    async_session.add(job1)
    await async_session.commit()

    # 1. Create Application
    create_payload = CreateApplicationPayload(job_id=job1.id, status="Applied", priority="High")
    app_res = await create_application_endpoint(create_payload, current_user=user, session=async_session)
    assert app_res["job_id"] == job1.id
    assert app_res["status"] == "Applied"
    assert len(app_res["history"]) >= 1

    app_id = app_res["id"]

    # 2. Update Status to Interview
    update_payload = UpdateStatusPayload(status="Interview", notes="Technical Interview scheduled")
    updated_res = await update_application_status_endpoint(
        app_id, payload=update_payload, current_user=user, session=async_session
    )
    assert updated_res["status"] == "Interview"
    assert len(updated_res["history"]) == 2
    assert any(h["new_status"] == "Interview" for h in updated_res["history"])

    # 3. List Applications
    list_res = await list_applications_endpoint(status_filter=None, archived=False, current_user=user, session=async_session)
    assert len(list_res) >= 1
    assert list_res[0]["id"] == app_id
    assert list_res[0]["status"] == "Interview"
