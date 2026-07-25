import uuid
from datetime import datetime, timezone
import pytest

from app.models.company import Company
from app.models.source import Source
from app.models.job import Job
from app.routers.auth import register, RegisterRequest
from app.services.auth_service import AuthService
from app.routers.interview_coach import generate_interview_prep_endpoint


@pytest.mark.anyio
async def test_ai_interview_coach_generation(async_session):
    unique_suffix = str(uuid.uuid4())[:8]

    # Register user
    reg_req = RegisterRequest(
        email=f"candidate-{unique_suffix}@example.com",
        password="password123",
        full_name=f"Candidate {unique_suffix}",
    )
    await register(reg_req, session=async_session)
    user, _ = await AuthService.authenticate_user(async_session, reg_req.email, "password123")

    # Create job
    company = Company(name=f"Datadog-{unique_suffix}")
    source = Source(name=f"test_source-{unique_suffix}")
    async_session.add_all([company, source])
    await async_session.flush()

    job1 = Job(
        source_id=source.id,
        company_id=company.id,
        title="Staff Backend Systems Engineer",
        description="High throughput systems using Go, Python, PostgreSQL, Kafka, and Kubernetes.",
        location="Remote",
        apply_url=f"https://datadog.example/apply/{unique_suffix}",
        slug=f"datadog-systems-{unique_suffix}",
        skills=["python", "go", "postgresql", "kafka"],
        remote=True,
        published_at=datetime.now(timezone.utc),
    )
    async_session.add(job1)
    await async_session.commit()

    # Generate Interview Prep Kit
    prep_res = await generate_interview_prep_endpoint(job1.id, current_user=user, session=async_session)
    assert prep_res["company"] == f"Datadog-{unique_suffix}"
    assert prep_res["role"] == "Staff Backend Systems Engineer"
    assert len(prep_res["technical_questions"]) >= 2
    assert len(prep_res["coding_questions"]) >= 2
    assert len(prep_res["system_design_questions"]) >= 1
    assert len(prep_res["behavioral_questions"]) >= 1
    assert "Python" in prep_res["topics_to_review"] or "Postgresql" in prep_res["topics_to_review"] or "Go" in prep_res["topics_to_review"]
