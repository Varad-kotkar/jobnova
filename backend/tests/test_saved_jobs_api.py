import uuid
from datetime import datetime, timezone
import pytest
from fastapi import HTTPException

from app.models.company import Company
from app.models.source import Source
from app.models.job import Job
from app.models.user import User
from app.routers.auth import register, RegisterRequest
from app.routers.saved_jobs import (
    save_job_endpoint,
    remove_saved_job_endpoint,
    list_saved_jobs_endpoint,
    get_saved_job_ids_endpoint,
)


@pytest.mark.anyio
async def test_saved_jobs_persistence(async_session):
    unique_suffix = str(uuid.uuid4())[:8]

    # Register candidate user
    reg_req = RegisterRequest(
        email=f"candidate-{unique_suffix}@example.com",
        password="password123",
        full_name=f"Candidate {unique_suffix}",
    )
    reg_res = await register(reg_req, session=async_session)

    # Query created User model instance from DB
    from app.services.auth_service import AuthService
    user, _ = await AuthService.authenticate_user(async_session, reg_req.email, "password123")

    # Create job
    company = Company(name=f"Stripe-{unique_suffix}")
    source = Source(name=f"test_source-{unique_suffix}")
    async_session.add_all([company, source])
    await async_session.flush()

    job1 = Job(
        source_id=source.id,
        company_id=company.id,
        title="Senior Python Backend Developer",
        description="FastAPI microservices",
        location="Remote",
        apply_url=f"https://stripe.example/apply/{unique_suffix}",
        slug=f"stripe-backend-{unique_suffix}",
        skills=["python", "fastapi"],
        remote=True,
        published_at=datetime.now(timezone.utc),
    )
    async_session.add(job1)
    await async_session.commit()

    # 1. Save Job
    save_res = await save_job_endpoint(job1.id, payload=None, current_user=user, session=async_session)
    assert save_res["saved"] is True
    assert save_res["job_id"] == job1.id

    # 2. Get Saved Job IDs
    ids_res = await get_saved_job_ids_endpoint(current_user=user, session=async_session)
    assert job1.id in ids_res

    # 3. List Saved Jobs
    list_res = await list_saved_jobs_endpoint(current_user=user, session=async_session)
    assert len(list_res) >= 1
    assert list_res[0]["job"]["id"] == job1.id

    # 4. Remove Saved Job
    remove_res = await remove_saved_job_endpoint(job1.id, current_user=user, session=async_session)
    assert remove_res["saved"] is False

    # Verify empty after removal
    updated_ids = await get_saved_job_ids_endpoint(current_user=user, session=async_session)
    assert job1.id not in updated_ids
